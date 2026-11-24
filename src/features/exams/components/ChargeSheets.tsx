import React, { useCallback, useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { NoticeModal } from '@/components/NoticeModal';
import { Sheet, type SheetHandle } from '@/components/Sheet';
import { useCredits } from '@/state/CreditsProvider';
import type { useChargeFlow } from '../hooks/useChargeFlow';
import { NotEnoughCreditsSheet } from './NotEnoughCreditsSheet';
import { OfflineChargeSheet } from './OfflineChargeSheet';

type Props = {
  flow: ReturnType<typeof useChargeFlow>;
  /** The most items the balance pays for, when "Make it N items instead" makes sense. */
  affordableItems?: number;
  onMakeSmaller?: () => void;
  /** "Keep reviewing offline", or the sheet swiped away: the attempt stays saved and is settled later. */
  onKeepOffline: () => void;
};

/** What the charge flow shows beyond "working": the two sheets (mockups 11 and 12) and a notice for a failure. */
export function ChargeSheets({ flow, affordableItems = 0, onMakeSmaller, onKeepOffline }: Props) {
  const { balanceUnits } = useCredits();
  const sheetRef = useRef<SheetHandle>(null);
  const { state, dismiss } = flow;
  const kind = state.kind;
  const isSheetKind = kind === 'insufficient' || kind === 'offline';
  const wasKindRef = useRef<typeof kind>('idle');

  useEffect(() => {
    if (isSheetKind) sheetRef.current?.expand();
    else sheetRef.current?.close();
  }, [isSheetKind]);

  // Dragging the sheet away is the same as its quiet button.
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        wasKindRef.current = kind;
        return;
      }
      if (wasKindRef.current === 'offline' && kind === 'offline') onKeepOffline();
      else if (kind === 'insufficient') dismiss();
    },
    [kind, dismiss, onKeepOffline],
  );

  const getCredits = useCallback(() => {
    dismiss();
    router.push('/credits');
  }, [dismiss]);

  return (
    <>
      <Sheet ref={sheetRef} onOpenChange={handleOpenChange}>
        {state.kind === 'insufficient' && (
          <NotEnoughCreditsSheet
            itemCount={state.itemCount}
            neededUnits={state.neededUnits}
            balanceUnits={balanceUnits}
            affordableItems={affordableItems}
            onGetCredits={getCredits}
            onMakeSmaller={onMakeSmaller}
          />
        )}
        {state.kind === 'offline' && <OfflineChargeSheet reason={state.reason} isRetrying={state.isRetrying} onTryAgain={() => void flow.retry()} onKeepOffline={onKeepOffline} />}
      </Sheet>
      <NoticeModal
        visible={state.kind === 'failed'}
        icon="error"
        tone="danger"
        title={state.kind === 'failed' ? state.title : ''}
        body={state.kind === 'failed' ? state.message : ''}
        actionLabel="OK"
        onAction={dismiss}
      />
    </>
  );
}
