import { describe, expect, it } from 'vitest';
import { ApiError, OfflineError, RequestCancelledError } from '@/api/errors';
import { isChargeStillPending, settleCharge, type ChargePorts, type PendingCharge } from '../chargeFlow';

const PENDING: PendingCharge = { attemptId: 'attempt-1', chargeId: 'key-1', examName: 'Numerical drill', itemCount: 30 };

/** A server that charges once per key, like reviewer-api, and a phone whose connection can drop. */
function createWorld(balanceUnits: number) {
  const world = {
    balanceUnits,
    chargesByKey: new Map<string, number>(),
    isOnline: true,
    /** The request reaches the server and charges, but the answer is lost on the way back. */
    losesAnswer: false,
    keysSent: [] as string[],
    built: [] as string[],
    discarded: [] as string[],
    appliedBalances: [] as number[],
    buildResult: 'built' as 'built' | 'already_built' | 'source_missing',
  };
  const ports: ChargePorts = {
    requestCharge: async ({ idempotencyKey, itemCount }) => {
      world.keysSent.push(idempotencyKey);
      if (!world.isOnline) throw new OfflineError();
      if (!world.chargesByKey.has(idempotencyKey)) {
        if (world.balanceUnits < itemCount) throw new ApiError(402, 'insufficient_credits', 'Not enough.');
        world.balanceUnits -= itemCount;
        world.chargesByKey.set(idempotencyKey, itemCount);
      }
      if (world.losesAnswer) throw new OfflineError();
      return { balanceUnits: world.balanceUnits };
    },
    applyBalance: (units) => world.appliedBalances.push(units),
    buildAttempt: async (attemptId) => {
      world.built.push(attemptId);
      return world.buildResult;
    },
    discardAttempt: async (attemptId) => {
      world.discarded.push(attemptId);
    },
  };
  return { world, ports };
}

describe('the charge flow', () => {
  it('charges, takes the balance, builds the attempt and is ready', async () => {
    const { world, ports } = createWorld(100);
    expect(await settleCharge(PENDING, ports)).toEqual({ kind: 'ready', attemptId: 'attempt-1', balanceUnits: 70 });
    expect(world.appliedBalances).toEqual([70]);
    expect(world.built).toEqual(['attempt-1']);
    expect(world.discarded).toEqual([]);
  });

  it('drops the local attempt on a 402 and builds nothing', async () => {
    const { world, ports } = createWorld(10);
    expect(await settleCharge(PENDING, ports)).toEqual({ kind: 'insufficient_credits' });
    expect(world.discarded).toEqual(['attempt-1']);
    expect(world.built).toEqual([]);
    expect(world.appliedBalances).toEqual([]);
  });

  it('keeps the attempt when offline, builds nothing, and says to try again', async () => {
    const { world, ports } = createWorld(100);
    world.isOnline = false;
    const outcome = await settleCharge(PENDING, ports);
    expect(outcome).toEqual({ kind: 'offline' });
    expect(isChargeStillPending(outcome)).toBe(true);
    expect(world.discarded).toEqual([]);
    expect(world.built).toEqual([]);
  });

  it('retries with the same key and charges exactly once after going offline', async () => {
    const { world, ports } = createWorld(100);
    world.isOnline = false;
    await settleCharge(PENDING, ports);
    world.isOnline = true;
    expect(await settleCharge(PENDING, ports)).toMatchObject({ kind: 'ready', balanceUnits: 70 });
    expect(world.keysSent).toEqual(['key-1', 'key-1']);
    expect(world.chargesByKey.size).toBe(1);
    expect(world.balanceUnits).toBe(70);
  });

  it('charges once even when the server charged but the answer never arrived', async () => {
    const { world, ports } = createWorld(100);
    world.losesAnswer = true;
    expect(await settleCharge(PENDING, ports)).toEqual({ kind: 'offline' });
    expect(world.balanceUnits).toBe(70);

    world.losesAnswer = false;
    expect(await settleCharge(PENDING, ports)).toMatchObject({ kind: 'ready', balanceUnits: 70 });
    expect(world.keysSent).toEqual(['key-1', 'key-1']);
    expect(world.balanceUnits).toBe(70);
  });

  it('keeps the attempt on a server error, to try again with the same key', async () => {
    const { world, ports } = createWorld(100);
    ports.requestCharge = async () => {
      throw new ApiError(503, 'service_unavailable', 'Busy.');
    };
    const outcome = await settleCharge(PENDING, ports);
    expect(outcome).toEqual({ kind: 'unavailable' });
    expect(isChargeStillPending(outcome)).toBe(true);
    expect(world.discarded).toEqual([]);
  });

  it('drops the attempt when the server refuses the request for good', async () => {
    const { world, ports } = createWorld(100);
    ports.requestCharge = async () => {
      throw new ApiError(422, 'validation_failed', 'Bad.');
    };
    expect(await settleCharge(PENDING, ports)).toEqual({ kind: 'rejected', code: 'validation_failed' });
    expect(world.discarded).toEqual(['attempt-1']);
  });

  it('does nothing more when the screen cancelled the request, and keeps the attempt', async () => {
    const { world, ports } = createWorld(100);
    ports.requestCharge = async () => {
      throw new RequestCancelledError();
    };
    const outcome = await settleCharge(PENDING, ports);
    expect(outcome).toEqual({ kind: 'cancelled' });
    expect(isChargeStillPending(outcome)).toBe(true);
    expect(world.discarded).toEqual([]);
  });

  it('reports a charged exam whose topic has nothing left, after taking the balance', async () => {
    const { world, ports } = createWorld(100);
    world.buildResult = 'source_missing';
    expect(await settleCharge(PENDING, ports)).toEqual({ kind: 'source_missing', balanceUnits: 70 });
    expect(world.appliedBalances).toEqual([70]);
    expect(world.discarded).toEqual(['attempt-1']);
  });

  it('lets an error that is not the network or the server through', async () => {
    const { ports } = createWorld(100);
    ports.requestCharge = async () => {
      throw new Error('boom');
    };
    await expect(settleCharge(PENDING, ports)).rejects.toThrow('boom');
  });
});
