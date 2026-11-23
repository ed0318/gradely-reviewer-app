import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { decodeBase64, encodeBase64 } from '@/lib/base64';
import { calculateExamCostUnits } from '@/lib/creditUnits';
import { MOCK_APP_VERSIONS, MOCK_CODE, MOCK_PRODUCTS, type MockState, type MockTransaction, type MockUser } from './mockState';

/**
 * A dummy reviewer-api, answering the same paths with the same envelopes,
 * fields, status codes and error codes (routes/api.php and app/Http/Resources),
 * so the app runs end to end with no server and switches to the real one by
 * turning EXPO_PUBLIC_API_MOCK off. Pure: state in, answer out.
 */
export type MockRequest = { method: string; path: string; query: URLSearchParams; body: Record<string, unknown> | null; token: string | null };
export type MockAnswer = { status: number; body: unknown };
export type MockContext = { state: MockState; createId: () => string; now: () => Date };

const ok = (result: unknown, message = 'OK.', status = 200): MockAnswer => ({ status, body: { success: true, message, ...(result === undefined ? {} : { result }) } });
const list = (results: unknown[], message: string, pagination?: unknown): MockAnswer => ({ status: 200, body: { success: true, message, results, ...(pagination ? { pagination } : {}) } });
const refuse = (status: number, code: string, message: string, errors?: Record<string, string[]>): MockAnswer => ({
  status,
  body: { success: false, code, message, ...(errors ? { errors } : {}) },
});
const invalid = (errors: Record<string, string[]>) => refuse(422, 'validation_failed', Object.values(errors)[0][0], errors);

const toUserPayload = (user: MockUser) => ({
  id: user.id,
  email: user.email,
  first_name: user.firstName,
  last_name: user.lastName,
  is_email_verified: true,
  has_password: user.password !== null,
  has_google: user.hasGoogle,
  has_apple: user.hasApple,
  balance_units: user.balanceUnits,
});

const toTransactionPayload = (row: MockTransaction) => ({
  id: row.id,
  type: row.type,
  units: row.units,
  balance_after_units: row.balanceAfterUnits,
  exam_name: row.examName,
  item_count: row.itemCount,
  created_at: row.createdAt,
});

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
const isEmail = (value: string) => /.+@.+\..+/.test(value);

function startSession(context: MockContext, user: MockUser, message: string, status = 200): MockAnswer {
  const token = `mock-token-${context.state.nextTokenNumber++}`;
  context.state.tokens[token] = user.id;
  return ok({ token, token_type: 'bearer', expires_in: 3600, user: toUserPayload(user) }, message, status);
}

function createUser(context: MockContext, email: string, password: string | null, firstName = '', lastName = ''): MockUser {
  const keyBytes = Uint8Array.from({ length: 32 }, () => Math.floor(Math.random() * 256));
  const user: MockUser = { id: context.createId(), email, password, firstName, lastName, balanceUnits: 0, backupKey: encodeBase64(keyBytes), hasGoogle: false, hasApple: false };
  context.state.users.push(user);
  return user;
}

export function handleMockRequest(context: MockContext, request: MockRequest): MockAnswer {
  const { state } = context;
  const route = `${request.method} ${request.path}`;
  const body = request.body ?? {};
  const signedIn = request.token ? state.users.find((user) => user.id === state.tokens[request.token ?? '']) ?? null : null;

  switch (route) {
    case 'GET /health':
      return ok({ status: 'ok', database: 'up', time: context.now().toISOString() }, 'Service is reachable.');
    case 'GET /products':
      return list(MOCK_PRODUCTS, 'Credit packs.');
    case 'GET /app/version':
      return list(MOCK_APP_VERSIONS, 'App versions.');

    case 'POST /auth/register': {
      const email = text(body.email).toLowerCase();
      const password = typeof body.password === 'string' ? body.password : '';
      const errors: Record<string, string[]> = {};
      if (!isEmail(email)) errors.email = ['The email field must be a valid email address.'];
      if (password.length < 8 || password.length > 72) errors.password = ['The password field must be between 8 and 72 characters.'];
      if (Object.keys(errors).length > 0) return invalid(errors);
      if (state.users.some((user) => user.email === email)) return refuse(409, 'email_taken', 'An account already uses that email. Sign in instead.');
      return startSession(context, createUser(context, email, password, text(body.first_name), text(body.last_name)), 'Account created.', 201);
    }
    case 'POST /auth/login': {
      const user = state.users.find((candidate) => candidate.email === text(body.email).toLowerCase());
      if (!user || user.password === null || user.password !== body.password) return refuse(401, 'invalid_credentials', 'That email or password is not right.');
      return startSession(context, user, 'Signed in.');
    }
    case 'POST /auth/social/google':
    case 'POST /auth/social/apple': {
      if (!text(body.id_token)) return invalid({ id_token: ['The id token field is required.'] });
      const isApple = request.path.endsWith('apple');
      const email = isApple ? 'apple.student@example.com' : 'google.student@example.com';
      const user = state.users.find((candidate) => candidate.email === email) ?? createUser(context, email, null, isApple ? text(body.first_name) : 'Gabby', isApple ? text(body.last_name) : 'Santos');
      if (isApple) user.hasApple = true;
      else user.hasGoogle = true;
      return startSession(context, user, 'Signed in.');
    }
    case 'POST /auth/refresh': {
      if (!signedIn || !request.token) return refuse(401, 'unauthenticated', 'Please sign in again.');
      delete state.tokens[request.token];
      const token = `mock-token-${state.nextTokenNumber++}`;
      state.tokens[token] = signedIn.id;
      return ok({ token, token_type: 'bearer', expires_in: 3600 }, 'Token refreshed.');
    }
    case 'POST /auth/password/forgot':
      if (!isEmail(text(body.email))) return invalid({ email: ['The email field must be a valid email address.'] });
      return ok(undefined, 'If an account uses that email, a code is on its way.');
    case 'POST /auth/password/reset': {
      const user = state.users.find((candidate) => candidate.email === text(body.email).toLowerCase());
      if (body.code !== MOCK_CODE || !user) return refuse(422, 'invalid_code', 'That code is not right.');
      const password = typeof body.password === 'string' ? body.password : '';
      if (password.length < 8 || password.length > 72) return invalid({ password: ['The password field must be between 8 and 72 characters.'] });
      user.password = password;
      return ok(undefined, 'Password changed. Sign in with your new password.');
    }
  }

  // Everything below needs a signed-in account.
  if (!signedIn || !request.token) return refuse(401, 'unauthenticated', 'Please sign in again.');

  switch (route) {
    case 'POST /auth/logout':
      delete state.tokens[request.token];
      return ok(undefined, 'Signed out.');
    case 'GET /me':
      return ok(toUserPayload(signedIn));
    case 'PATCH /me': {
      const firstName = text(body.first_name);
      const lastName = text(body.last_name);
      const errors: Record<string, string[]> = {};
      if (!firstName) errors.first_name = ['The first name field is required.'];
      if (!lastName) errors.last_name = ['The last name field is required.'];
      if (Object.keys(errors).length > 0) return invalid(errors);
      signedIn.firstName = firstName;
      signedIn.lastName = lastName;
      return ok(toUserPayload(signedIn), 'Name updated.');
    }
    case 'DELETE /me':
      state.users = state.users.filter((user) => user.id !== signedIn.id);
      state.transactions = state.transactions.filter((row) => row.userId !== signedIn.id);
      for (const [token, userId] of Object.entries(state.tokens)) if (userId === signedIn.id) delete state.tokens[token];
      return ok(undefined, 'Your account has been deleted.');
    case 'GET /credits/transactions':
      return listTransactions(state, signedIn, request.query);
    case 'POST /exams/charge':
      return chargeExam(context, signedIn, body);
    case 'POST /purchases/refresh':
      return ok({ credited_units: 0, credited_purchase_count: 0, balance_units: signedIn.balanceUnits }, 'Purchases checked.');
    case 'POST /device/handover/send-code': {
      const owner = state.users.find((user) => user.id === body.owner_id);
      if (!owner) return ok({ owner_gone: true, sent_to: null }, 'A code was sent to the owner.');
      const [name, domain] = owner.email.split('@');
      return ok({ owner_gone: false, sent_to: `${name[0]}•••${name.slice(-1)}@${domain}` }, 'A code was sent to the owner.');
    }
    case 'POST /device/handover/confirm': {
      const owner = state.users.find((user) => user.id === body.owner_id);
      if (!owner) return ok({ owner_gone: true, account_id: null, file_key: null }, 'Hand-over confirmed.');
      if (body.code !== MOCK_CODE) return refuse(422, 'invalid_code', 'That code is not right.');
      const info = new TextEncoder().encode(`gradely-reviewer-backup.v1:${owner.id}`);
      const fileKey = hkdf(sha256, decodeBase64(owner.backupKey), decodeBase64(String(body.salt)), info, 32);
      return ok({ owner_gone: false, account_id: owner.id, file_key: encodeBase64(fileKey) }, 'Hand-over confirmed.');
    }
  }
  return refuse(404, 'not_found', 'That page does not exist.');
}

function listTransactions(state: MockState, user: MockUser, query: URLSearchParams): MockAnswer {
  const perPage = Math.min(50, Math.max(1, Number(query.get('per_page') ?? 10)));
  const page = Math.max(1, Number(query.get('page') ?? 1));
  const search = (query.get('search') ?? '').toLowerCase();
  const rows = state.transactions
    .filter((row) => row.userId === user.id && (!search || (row.examName ?? '').toLowerCase().includes(search)))
    .sort((left, right) => (query.get('sort') === 'oldest' ? left.id - right.id : right.id - left.id));
  const from = (page - 1) * perPage;
  const pageRows = rows.slice(from, from + perPage);
  return list(pageRows.map(toTransactionPayload), 'Credit history.', {
    total: rows.length,
    per_page: perPage,
    current_page: page,
    last_page: Math.max(1, Math.ceil(rows.length / perPage)),
    from: pageRows.length ? from + 1 : null,
    to: pageRows.length ? from + pageRows.length : null,
  });
}

function chargeExam(context: MockContext, user: MockUser, body: Record<string, unknown>): MockAnswer {
  const key = text(body.idempotency_key);
  const examName = text(body.exam_name);
  const itemCount = Number(body.item_count);
  const errors: Record<string, string[]> = {};
  if (!key) errors.idempotency_key = ['The idempotency key field is required.'];
  if (!examName) errors.exam_name = ['The exam name field is required.'];
  if (!Number.isInteger(itemCount) || itemCount < 1 || itemCount > 100) errors.item_count = ['The item count field must be between 1 and 100.'];
  if (Object.keys(errors).length > 0) return invalid(errors);

  const toCharge = (row: MockTransaction, isReplay: boolean) => ({
    charge_id: row.id,
    idempotency_key: row.idempotencyKey,
    exam_name: row.examName,
    item_count: row.itemCount,
    units_charged: -row.units,
    balance_units: user.balanceUnits,
    is_replay: isReplay,
    charged_at: row.createdAt,
  });

  const earlier = context.state.transactions.find((row) => row.userId === user.id && row.idempotencyKey === key);
  if (earlier) {
    if (earlier.itemCount !== itemCount || earlier.examName !== examName) return refuse(409, 'idempotency_key_reused', 'That request key was already used for a different exam.');
    return ok(toCharge(earlier, true), 'Exam charged.');
  }
  // The app's own price, which reviewer-api's CreditUnits matches.
  const units = calculateExamCostUnits(itemCount);
  if (user.balanceUnits < units) return refuse(402, 'insufficient_credits', 'You do not have enough credits for this exam.');
  user.balanceUnits -= units;
  const row: MockTransaction = {
    id: context.state.nextTransactionId++,
    userId: user.id,
    type: 'exam_charge',
    units: -units,
    balanceAfterUnits: user.balanceUnits,
    idempotencyKey: key,
    examName,
    itemCount,
    createdAt: context.now().toISOString(),
  };
  context.state.transactions.push(row);
  return ok(toCharge(row, false), 'Exam charged.', 201);
}
