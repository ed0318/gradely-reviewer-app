import { queueWrite } from '@/db/client';
import { saveLowCreditAlertSettings, saveProfilePhotoPath } from '@/db/repositories/account';
import { insertTopic } from '@/db/repositories/topics';
import { createId } from '@/lib/ids';
import { UNITS_PER_CREDIT } from '@/lib/creditUnits';
import type { AccountUser } from '@/api/auth';
import { saveAccountName } from './actions';

export type OnboardingAnswers = {
  firstName: string;
  lastName: string;
  /** Relative path of a photo picked during setup, or null. */
  photoPath: string | null;
  isLowCreditAlertOn: boolean;
  lowCreditThresholdCredits: number;
  firstTopic: { title: string; subjectLabel: string } | null;
};

/**
 * Finishes setup. The name goes to the server first (it is the one step that
 * needs a connection, and it is what ends onboarding); the rest stays on the phone.
 */
export async function finishOnboarding(answers: OnboardingAnswers, now: number = Date.now()): Promise<AccountUser> {
  const user = await saveAccountName(answers.firstName, answers.lastName);
  await queueWrite(async (database) => {
    if (answers.photoPath) await saveProfilePhotoPath(database, answers.photoPath);
    await saveLowCreditAlertSettings(database, {
      lowCreditAlertOn: answers.isLowCreditAlertOn,
      lowCreditThresholdUnits: answers.lowCreditThresholdCredits * UNITS_PER_CREDIT,
    });
    if (answers.firstTopic) {
      await insertTopic(database, {
        id: createId(),
        title: answers.firstTopic.title.trim(),
        subjectLabel: answers.firstTopic.subjectLabel.trim() || null,
        generalDirections: '',
        source: 'own',
        sourceRef: null,
        createdAt: now,
        updatedAt: now,
      });
    }
  });
  return user;
}
