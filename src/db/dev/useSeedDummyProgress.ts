import { useEffect, useRef } from 'react';
import { File, Paths } from 'expo-file-system';
import { isApiMocked } from '@/api/config';
import { openDatabase, queueWrite } from '@/db/client';
import { announceExamsChanged, useExamsChangeVersion } from '@/features/exams/examsChangeSignal';
import { useAccount } from '@/state/AccountProvider';
import { getTopic } from '../repositories/topics';
import { buildDummyProgressExams, DUMMY_PROGRESS_TOPIC_IDS } from './dummyProgressData';
import { buildDummyTopics } from './dummyTopicData';
import { seedDummyExam } from './seedDummyExams';

/**
 * DEV ONLY: more finished exams for the Progress tab (two ordinary ones and one
 * with 200 attempts), written after `useSeedDummyExams` has run.
 *
 * ON under the same conditions as the other dummy seeds (development build, the
 * dummy API on, `EXPO_PUBLIC_DEV_SEED` not `0`, the dummy account Ana). It waits
 * for the exams seed's marker file, runs once, and records that with its own
 * marker `dev-seed-progress-v1` in the documents folder. Delete the app, or that
 * file, to run it again (it rewrites its exams). It never calls the server.
 *
 * To remove the feature: delete `src/db/dev/useSeedDummyProgress.ts` and
 * `dummyProgressData.ts` and the one call in app/(tabs)/_layout.tsx, or delete `src/db/dev` whole.
 */
const IS_SEED_ENABLED = __DEV__ && isApiMocked && process.env.EXPO_PUBLIC_DEV_SEED !== '0';
const DUMMY_ACCOUNT_EMAIL = 'ana@example.com';
const EXAMS_MARKER_FILE_NAME = 'dev-seed-exams-v1';
const MARKER_FILE_NAME = 'dev-seed-progress-v1';

export function useSeedDummyProgress(): void {
  const { session } = useAccount();
  const signedInEmail = session.kind === 'signed_in' ? session.account.email : null;
  // The exams seed ticks this when it is done; a phone that already has them starts at once.
  const examsVersion = useExamsChangeVersion();
  const isStartedRef = useRef(false);

  useEffect(() => {
    if (!IS_SEED_ENABLED || signedInEmail !== DUMMY_ACCOUNT_EMAIL || isStartedRef.current) return;
    const marker = new File(Paths.document, MARKER_FILE_NAME);
    if (marker.exists || !new File(Paths.document, EXAMS_MARKER_FILE_NAME).exists) return;

    let isActive = true;
    const timer = setTimeout(() => {
      void (async () => {
        const database = await openDatabase();
        for (const topicId of DUMMY_PROGRESS_TOPIC_IDS) if (!(await getTopic(database, topicId))) return;
        if (!isActive || isStartedRef.current) return;
        isStartedRef.current = true;
        for (const built of buildDummyProgressExams(buildDummyTopics(), Date.now())) await queueWrite((writer) => seedDummyExam(writer, built));
        marker.write('seeded');
        announceExamsChanged();
      })().catch((error: unknown) => {
        isStartedRef.current = false;
        console.warn('[reviewer] dummy progress not seeded', error);
      });
    }, 1500);
    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [signedInEmail, examsVersion]);
}
