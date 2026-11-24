import { useEffect, useRef } from 'react';
import { File, Paths } from 'expo-file-system';
import { isApiMocked } from '@/api/config';
import { openDatabase, queueWrite } from '@/db/client';
import { announceExamsChanged } from '@/features/exams/examsChangeSignal';
import { useTopicsChangeVersion } from '@/features/topics/topicsChangeSignal';
import { useAccount } from '@/state/AccountProvider';
import { getTopic } from '../repositories/topics';
import { buildDummyExams, DUMMY_EXAM_TOPIC_IDS } from './dummyExamData';
import { buildDummyTopics } from './dummyTopicData';
import { seedDummyExam } from './seedDummyExams';

/**
 * DEV ONLY: fills the phone with dummy exams (three with finished attempts and
 * one scheduled) so Home, Results and Progress have something to show.
 *
 * ON under the same conditions as the dummy topics (`useSeedDummyTopics`): a
 * development build, the dummy API on, `EXPO_PUBLIC_DEV_SEED` not `0`, and the
 * dummy account (Ana). It waits until the dummy topics are on the phone (their
 * seed ticks the topics signal as it writes), runs once, and records that with
 * its own marker file `dev-seed-exams-v1` in the documents folder. Delete the
 * app, or that file, to run it again. It never calls the server.
 *
 * To remove the feature: delete `src/db/dev` and the three seed calls in app/(tabs)/_layout.tsx.
 */
const IS_SEED_ENABLED = __DEV__ && isApiMocked && process.env.EXPO_PUBLIC_DEV_SEED !== '0';
const DUMMY_ACCOUNT_EMAIL = 'ana@example.com';
const MARKER_FILE_NAME = 'dev-seed-exams-v1';

export function useSeedDummyExams(): void {
  const { session } = useAccount();
  const signedInEmail = session.kind === 'signed_in' ? session.account.email : null;
  const topicsVersion = useTopicsChangeVersion();
  const isStartedRef = useRef(false);

  useEffect(() => {
    if (!IS_SEED_ENABLED || signedInEmail !== DUMMY_ACCOUNT_EMAIL || isStartedRef.current) return;
    const marker = new File(Paths.document, MARKER_FILE_NAME);
    if (marker.exists) return;

    let isActive = true;
    const timer = setTimeout(() => {
      void (async () => {
        const database = await openDatabase();
        // The exams copy the topics' questions, so they wait for all of them.
        for (const topicId of DUMMY_EXAM_TOPIC_IDS) if (!(await getTopic(database, topicId))) return;
        if (!isActive || isStartedRef.current) return;
        isStartedRef.current = true;
        for (const built of buildDummyExams(buildDummyTopics(), Date.now())) await queueWrite((writer) => seedDummyExam(writer, built));
        marker.write('seeded');
        announceExamsChanged();
      })().catch((error: unknown) => {
        isStartedRef.current = false;
        console.warn('[reviewer] dummy exams not seeded', error);
      });
    }, 900);
    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [signedInEmail, topicsVersion]);
}
