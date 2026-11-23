import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Button } from '@/components/Button';
import { PaperScreen } from '@/components/PaperScreen';
import { useAccountExit } from '@/features/account/hooks/useAccountExit';
import { HandoverCodeStep } from '@/features/handover/components/HandoverCodeStep';
import { HandoverConfirmStep } from '@/features/handover/components/HandoverConfirmStep';
import { HandoverEraseStep } from '@/features/handover/components/HandoverEraseStep';
import { useHandoverFlow } from '@/features/handover/useHandoverFlow';
import { useAccount } from '@/state/AccountProvider';
import { color, font } from '@/theme/theme';

const STEP_NUMBERS = { confirm: 1, code: 2, erase: 3 } as const;

/** Mockup 16, 16b, 16c: another person's reviewers are on this phone. */
export default function HandoverScreen() {
  const { session } = useAccount();
  if (session.kind !== 'handover') return null;
  return <HandoverFlow account={session.account} owner={session.owner} />;
}

function HandoverFlow({ account, owner }: { account: Parameters<typeof useHandoverFlow>[0]; owner: Parameters<typeof useHandoverFlow>[1] }) {
  const flow = useHandoverFlow(account, owner);
  const exit = useAccountExit();
  const isLocked = flow.isBusy || exit.isSigningOut;

  return (
    <PaperScreen
      footer={
        <>
          {flow.step === 'confirm' && <Button label={`Send code to ${flow.ownerFirstName}`} onPress={flow.sendCode} isBusy={flow.isBusy} isDisabled={!flow.canSendCode} />}
          {flow.step === 'code' && <Button label="Confirm code" onPress={flow.submitCode} isBusy={flow.isBusy} isDisabled={!flow.canSubmitCode} />}
          {flow.step === 'erase' && (
            <Button
              label={flow.backup.kind === 'failed' ? 'Erase anyway' : 'Erase and continue'}
              variant="danger"
              onPress={flow.erase}
              isBusy={flow.isBusy}
              isDisabled={!flow.canErase}
            />
          )}
          <Button label="Sign out" variant="quiet" onPress={exit.signOut} isBusy={exit.isSigningOut} isDisabled={isLocked} />
        </>
      }
    >
      <Text style={styles.stepLabel}>STEP {STEP_NUMBERS[flow.step]} OF 3</Text>
      {flow.step === 'confirm' && <HandoverConfirmStep flow={flow} owner={owner} />}
      {flow.step === 'code' && <HandoverCodeStep flow={flow} owner={owner} />}
      {flow.step === 'erase' && <HandoverEraseStep flow={flow} owner={owner} />}
    </PaperScreen>
  );
}

const styles = StyleSheet.create({
  stepLabel: { fontFamily: font.eyebrow, fontSize: 11, letterSpacing: 1.1, color: color.inkMuted },
});
