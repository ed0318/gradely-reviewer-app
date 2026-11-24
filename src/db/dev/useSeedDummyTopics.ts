import { useEffect } from 'react';
import { File, Paths } from 'expo-file-system';
import { isApiMocked } from '@/api/config';
import { queueWrite } from '@/db/client';
import { useAccount } from '@/state/AccountProvider';
import { announceTopicsChanged } from '@/features/topics/topicsChangeSignal';
import { buildDummyTopics } from './dummyTopicData';
import { seedDummyTopic } from './seedDummyTopics';

/**
 * DEV ONLY: fills the phone with dummy topics so the topic screens can be tried.
 *
 * ON when all of these hold: a development build (`__DEV__`), the dummy API is
 * on (`EXPO_PUBLIC_API_MOCK=1`), and `EXPO_PUBLIC_DEV_SEED` is not `0`. In a
 * release build `__DEV__` is false and this does nothing (and app.config.js
 * already refuses the mock there).
 *
 * It runs at launch for a signed-in session, so a reload of an already
 * signed-in phone seeds too, and only for the dummy account (Ana). It runs once:
 * a marker file in the documents folder records that it has, so deleting a
 * seeded topic does not bring it back. Delete the app (or that file) to seed again.
 *
 * To remove the feature: delete `src/db/dev` and the one call in app/(tabs)/_layout.tsx.
 */
const IS_SEED_ENABLED = __DEV__ && isApiMocked && process.env.EXPO_PUBLIC_DEV_SEED !== '0';
/** The mock server's seeded account (src/api/mock/mockState.ts). */
const DUMMY_ACCOUNT_EMAIL = 'ana@example.com';
const MARKER_FILE_NAME = 'dev-seed-topics-v1';

export function useSeedDummyTopics(): void {
  const { session } = useAccount();
  const signedInEmail = session.kind === 'signed_in' ? session.account.email : null;

  useEffect(() => {
    if (!IS_SEED_ENABLED || signedInEmail !== DUMMY_ACCOUNT_EMAIL) return;
    const marker = new File(Paths.document, MARKER_FILE_NAME);
    if (marker.exists) return;

    // Deferred past the first paint and the first reads; each topic is its own write.
    const timer = setTimeout(() => {
      void (async () => {
        const now = Date.now();
        const topics = buildDummyTopics();
        for (const [index, topic] of topics.entries()) {
          // The first topic is the newest; the big one the oldest, so it sits at the bottom of the list.
          await queueWrite((database) => seedDummyTopic(database, topic, now - index * 60_000));
          announceTopicsChanged();
        }
        marker.write('seeded');
      })().catch((error: unknown) => console.warn('[reviewer] dummy topics not seeded', error));
    }, 600);
    return () => clearTimeout(timer);
  }, [signedInEmail]);
}
