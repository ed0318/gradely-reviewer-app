import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { color, font, radius } from '@/theme/theme';
import { Icon } from './Icon';
import { IOS, IOS_DIM, PRESS_CLIP, RIPPLE } from '@/theme/press';
import { backUpThenConfirm, type BackupFirst } from './backupFirst';

export type { BackupFirst } from './backupFirst';

export type CascadeItem = { label: string; detail: string };

/** Where a delete that backs up first has got. */
export type BackupPhase = { state: 'saving'; progress: number } | { state: 'failed'; message: string } | null;

type Props = {
  visible: boolean;
  title: string;
  cascadeItems: CascadeItem[];
  /** What the delete leaves alone, shown under its own heading in green. Optional. */
  keepItems?: CascadeItem[];
  /** Wording on the confirm button. */
  confirmLabel?: string;
  /** The word the teacher types to unlock the button. `null` asks for no typing. */
  confirmWord?: string | null;
  /** Heading over the cascade list. Defaults to the wording a delete needs. */
  cascadeHeading?: string;
  /** The red line under the cascade. Defaults to the wording a delete needs; `null` drops it. */
  warning?: string | null;
  /**
   * `danger` is the delete look. `primary` is for a confirmation that is not
   * destructive — "you already have one of these, carry on anyway" — where a
   * red button would be telling the teacher they are about to break something.
   */
  tone?: 'danger' | 'primary';
  /** A backup is saved before the delete; the warning says so instead of "can't be undone". */
  backsUp?: boolean;
  /** Saving it, or why it could not be saved. */
  phase?: BackupPhase;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDeleteModal({
  visible,
  title,
  cascadeItems,
  keepItems = [],
  confirmLabel = 'Delete',
  confirmWord = 'DELETE',
  cascadeHeading = 'WHAT GOES WITH IT',
  warning = "This can't be undone.",
  tone = 'danger',
  backsUp = false,
  phase = null,
  onCancel,
  onConfirm,
}: Props) {
  const [text, setText] = useState('');
  const saving = phase?.state === 'saving';
  const failed = phase?.state === 'failed';
  // Case-sensitive on purpose: "delete" is not "DELETE". A destructive action
  // that accepts either is one a stray keystroke can unlock.
  const canConfirm = !saving && (confirmWord == null || text.trim() === confirmWord);
  const buttonLabel = saving
    ? `Saving a backup… ${Math.round((phase.progress ?? 0) * 100)}%`
    : failed
      ? `${confirmLabel} without a backup`
      : confirmLabel;

  // The modal stays mounted between uses, so clear the typed word each time it opens.
  // Adjusted while rendering (React's way to reset state on a prop change), not in an effect.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setText('');
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onCancel} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
              <Icon name="close" size={22} color={color.inkMuted} />
            </Pressable>
          </View>

          {cascadeItems.length > 0 && (
            <>
              <Text style={styles.label}>{cascadeHeading}</Text>
              <View style={styles.cascadeBox}>
                {cascadeItems.map((item, i) => (
                  <React.Fragment key={item.label}>
                    {i > 0 && <View style={styles.cascadeDivider} />}
                    <Text style={styles.cascadeLabel}>{item.label}</Text>
                    <Text style={styles.cascadeDetail}>{item.detail}</Text>
                  </React.Fragment>
                ))}
              </View>
            </>
          )}

          {keepItems.length > 0 && (
            <>
              <Text style={[styles.label, { marginTop: 14 }]}>WHAT STAYS</Text>
              <View style={styles.keepBox}>
                {keepItems.map((item, i) => (
                  <React.Fragment key={item.label}>
                    {i > 0 && <View style={styles.cascadeDivider} />}
                    <Text style={styles.cascadeLabel}>{item.label}</Text>
                    <Text style={styles.cascadeDetail}>{item.detail}</Text>
                  </React.Fragment>
                ))}
              </View>
            </>
          )}

          {backsUp ? (
            <View style={styles.backupNote}>
              <Icon name="backup" size={16} color={color.inkMuted} />
              <Text style={styles.backupNoteText}>A backup is saved first, so this can be undone from Settings → Your data → Backup and restore.</Text>
            </View>
          ) : (
            warning != null && <Text style={[styles.warning, tone === 'primary' && styles.warningPrimary]}>{warning}</Text>
          )}
          {failed && <Text style={styles.warning}>Couldn&apos;t save a backup, so nothing was deleted. {phase.message}</Text>}

          {confirmWord != null && (
            <>
              <Text style={[styles.label, { marginTop: 16 }]}>{`TYPE ${confirmWord} TO CONFIRM`}</Text>
              <TextInput
                value={text}
                onChangeText={setText}
                editable={!saving}
                // No auto-capitals: the word has to be typed exactly, and a
                // keyboard that capitalises for you makes that check meaningless.
                autoCapitalize="none"
                autoCorrect={false}
                placeholder={confirmWord}
                placeholderTextColor={color.inkMuted}
                accessibilityLabel={`Type ${confirmWord} to confirm`}
                style={styles.input}
              />
            </>
          )}

          <View style={styles.actions}>
            <Pressable android_ripple={RIPPLE} style={({ pressed }) => [styles.cancel, PRESS_CLIP, IOS && pressed && IOS_DIM]} onPress={onCancel} accessibilityRole="button">
              <Text style={styles.cancelLabel}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[
                styles.delete,
                // The button stays pale until the word is right, then fills in.
                canConfirm && tone !== 'primary' && styles.deleteReady,
                tone === 'primary' && styles.confirm,
                !canConfirm && { opacity: 0.5 },
              ]}
              disabled={!canConfirm}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canConfirm }}
              onPress={() => {
                // Kept while a backup runs, so a failed one can be confirmed past.
                if (!backsUp) setText('');
                onConfirm();
              }}
            >
              <Text
                style={[
                  styles.deleteLabel,
                  canConfirm && tone !== 'primary' && styles.deleteLabelReady,
                  tone === 'primary' && styles.confirmLabel,
                ]}
              >
                {buttonLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * How long a `<Modal>` takes to fade out, plus a little.
 *
 * React Native's fade animation is a fixed 300ms, and nothing in the API
 * reports when it has finished on both platforms. This is the one number in
 * this file that is a guess, and it is a generous one: too long is a barely
 * perceptible pause, too short is a dialog that never appears.
 */
const MODAL_DISMISS_MS = 360;

/**
 * Runs `fn` once a modal that is closing has had time to go.
 *
 * A plain timer on purpose. `InteractionManager.runAfterInteractions` was the
 * obvious tool and is the wrong one twice over: a `<Modal>`'s dismissal is not
 * an interaction it knows about, so the callback ran while the modal was still
 * up — and React Native 0.86 logs it as deprecated and due for removal.
 */
export function afterModalDismiss(fn: () => void): () => void {
  const handle = setTimeout(fn, MODAL_DISMISS_MS);
  return () => clearTimeout(handle);
}

export type PendingDelete = {
  title: string;
  cascadeItems: CascadeItem[];
  keepItems?: CascadeItem[];
  confirmLabel?: string;
  confirmWord?: string | null;
  cascadeHeading?: string;
  warning?: string | null;
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
  /** Anything to undo when the teacher backs out instead. */
  onCancel?: () => void;
  /**
   * Save a backup before `onConfirm` runs. The modal stays up while it saves,
   * showing how far it has got; Cancel stops it and nothing is deleted. If it
   * fails nothing is deleted either, and the button offers to go ahead
   * without one.
   */
  backupFirst?: BackupFirst;
};

/**
 * One confirmation flow for every destructive action in the app: say what goes
 * with it, and make the teacher type the word for it. Hosts render `confirmModal`
 * once and call `confirmDelete(...)` from wherever the action lives.
 */
export function useConfirmDelete() {
  const [pending, setPending] = useState<PendingDelete | null>(null);

  /**
   * The confirmed action, held until the modal has actually gone.
   *
   * It used to run inside the modal's own `onPress`, in the same tick as the
   * `setPending(null)` that dismisses it — and anything the action then tried to
   * put on screen was competing with a modal that was still dismissing. An
   * `Alert` raised in that window is dropped: iOS will not present an alert
   * while another modal is being torn down, and on Android the dialog is
   * attached to a window that is going away.
   *
   * That is why deleting an account looked like a dead button. The delete
   * itself ran — the account really was deleted — but both the confirmation and,
   * worse, any failure message vanished, so there was nothing on screen to say
   * either had happened.
   */
  const armed = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (pending !== null) return;
    const run = armed.current;
    if (!run) return;
    armed.current = null;

    // Not just "after the next render": the dismissal is an animation, and this
    // has to be after that, not after the state change that starts it.
    return afterModalDismiss(run);
  }, [pending]);

  // What the modal shows. It outlives `pending` by the fade-out: cleared at
  // once, the closing card fell back to the delete defaults, so confirming an
  // import flashed "This can't be undone · type DELETE" on its way out.
  const [view, setView] = useState<PendingDelete | null>(null);
  if (pending && pending !== view) setView(pending);

  const [phase, setPhase] = useState<BackupPhase>(null);
  const saving = useRef<AbortController | null>(null);
  // Leaving the screen mid-backup stops the backup and its progress callbacks.
  useEffect(() => () => saving.current?.abort(), []);
  const close = () => {
    saving.current?.abort();
    saving.current = null;
    setPhase(null);
    setPending(null);
  };

  const confirm = async () => {
    const current = pending;
    if (!current) return;
    const failedBefore = phase?.state === 'failed';
    const controller = new AbortController();
    if (current.backupFirst && !failedBefore) {
      saving.current = controller;
      setPhase({ state: 'saving', progress: 0 });
    }
    const outcome = await backUpThenConfirm(current.backupFirst, {
      failedBefore,
      signal: controller.signal,
      onProgress: (progress) => {
        if (!controller.signal.aborted) setPhase({ state: 'saving', progress });
      },
    });
    saving.current = null;
    // Cancelled: the modal has already gone, and nothing is deleted.
    if ('cancelled' in outcome) return;
    if ('failed' in outcome) return setPhase({ state: 'failed', message: outcome.failed });
    armed.current = current.onConfirm;
    setPhase(null);
    setPending(null);
  };

  const confirmModal = (
    <ConfirmDeleteModal
      visible={pending != null}
      title={view?.title ?? ''}
      cascadeItems={view?.cascadeItems ?? []}
      keepItems={view?.keepItems}
      confirmLabel={view?.confirmLabel}
      confirmWord={view ? view.confirmWord : undefined}
      cascadeHeading={view?.cascadeHeading}
      warning={view ? view.warning : undefined}
      tone={view?.tone}
      backsUp={!!view?.backupFirst}
      phase={phase}
      onCancel={() => {
        armed.current = null;
        pending?.onCancel?.();
        close();
      }}
      onConfirm={() => void confirm()}
    />
  );

  /**
   * Opens the confirmation — but never in the same breath as whatever is
   * already on screen.
   *
   * Several callers raise this from inside `EditorDialog`, which is itself a
   * `<Modal>`, and iOS will not present a second modal over one that is still
   * up: the confirmation was silently dropped and Delete did nothing at all.
   * Those callers now close their editor first, and the wait here is what lets
   * the dismissal finish before this one is asked to appear.
   *
   * A timer, and not `InteractionManager.runAfterInteractions` — which is what
   * this tried first, and it did not work. A `<Modal>`'s own dismissal is not
   * an interaction as far as the manager is concerned, so the callback ran on
   * the next frame, while the editor was still on screen, and the confirmation
   * was dropped exactly as before. `onDismiss` would be exact but is iOS-only,
   * so the wait is measured instead.
   */
  const confirmDelete = (next: PendingDelete) => {
    afterModalDismiss(() => setPending(next));
  };

  return { confirmDelete, confirmModal };
}

/**
 * The same modal, for a decision that is the teacher's to make rather than a
 * warning to be typed past: a name that already exists, a student who is
 * already on a roster somewhere. It states what it found, lists it, and lets
 * them carry on — so the defaults are no typed word and no red line.
 */
export function useConfirm() {
  const { confirmDelete, confirmModal } = useConfirmDelete();
  return {
    confirmModal,
    confirm: (next: Omit<PendingDelete, 'confirmWord' | 'tone'>) =>
      confirmDelete({ confirmWord: null, tone: 'primary', warning: null, ...next }),
  };
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(23, 34, 51,0.34)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 480, backgroundColor: color.sheet, borderRadius: radius.card, padding: 20, paddingTop: 22 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { flex: 1, fontFamily: font.sheetTitle, fontSize: 25, letterSpacing: -0.5, color: color.ink },
  label: { fontFamily: font.eyebrow, fontSize: 10.5, letterSpacing: 1.1, color: color.inkMuted, marginTop: 18, marginBottom: 10 },
  cascadeBox: { backgroundColor: color.paper, borderRadius: radius.card, padding: 14, paddingHorizontal: 16 },
  // The same box with a green edge: what is kept reads apart from what goes, by more than colour (its own heading).
  keepBox: { backgroundColor: color.paper, borderRadius: radius.card, padding: 14, paddingHorizontal: 16, borderLeftWidth: 3, borderLeftColor: color.ok },
  cascadeLabel: { fontFamily: font.rowTitle, fontSize: 13.5, color: color.ink },
  cascadeDetail: { fontFamily: font.uiRegular, fontSize: 12, color: color.inkMuted, marginTop: 3, lineHeight: 17 },
  cascadeDivider: { height: 1, backgroundColor: color.rule, marginVertical: 12 },
  warning: { fontFamily: font.ui, fontSize: 12.5, color: color.rust, marginTop: 14, lineHeight: 17 },
  warningPrimary: { color: color.inkMuted },
  backupNote: { flexDirection: 'row', gap: 8, marginTop: 14, alignItems: 'flex-start' },
  backupNoteText: { flex: 1, fontFamily: font.ui, fontSize: 12.5, lineHeight: 17, color: color.inkMuted },
  input: {
    backgroundColor: color.surface, borderWidth: 1, borderColor: color.fieldBorder,
    borderRadius: radius.field,
    height: 50,
    paddingHorizontal: 16,
    fontFamily: font.mono,
    fontSize: 15,
    letterSpacing: 1,
    color: color.ink,
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  cancel: { flex: 1, height: 50, borderRadius: radius.field, backgroundColor: color.rule, alignItems: 'center', justifyContent: 'center' },
  cancelLabel: { fontFamily: font.eyebrow, fontSize: 14, color: color.ink },
  delete: { flex: 1, minHeight: 50, borderRadius: radius.field, backgroundColor: color.dangerTintOff, alignItems: 'center', justifyContent: 'center' },
  deleteLabel: { fontFamily: font.eyebrow, fontSize: 14, color: color.dangerInkOff, textAlign: 'center', paddingHorizontal: 8 },
  deleteReady: { backgroundColor: color.rust },
  deleteLabelReady: { color: color.onPrimary },
  confirm: { backgroundColor: color.primary },
  confirmLabel: { color: color.onPrimary },
});
