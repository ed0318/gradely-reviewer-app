/**
 * A backup to save before a delete runs (`backUpBeforeDelete`), reporting how
 * far it has got. The delete waits for it; aborting `signal` stops it.
 */
export type BackupFirst = (onProgress: (fraction: number) => void, signal: AbortSignal) => Promise<unknown>;

/** What a press of the confirm button comes to. */
export type ConfirmOutcome =
  /** Go ahead with the delete. */
  | { go: true }
  /** The backup failed: nothing is deleted, and the button now offers to go ahead without one. */
  | { go: false; failed: string }
  /** Cancelled while the backup was being saved: nothing is deleted. */
  | { go: false; cancelled: true };

/**
 * The backup first, then the go-ahead — unless there is no backup to take,
 * or it has already failed once and the teacher is pressing again to delete
 * without one. A cancelled backup never deletes, and neither does a failed one.
 */
export async function backUpThenConfirm(
  backupFirst: BackupFirst | undefined,
  options: { failedBefore: boolean; signal: AbortSignal; onProgress: (fraction: number) => void },
): Promise<ConfirmOutcome> {
  if (!backupFirst || options.failedBefore) return { go: true };
  try {
    await backupFirst(options.onProgress, options.signal);
  } catch (err) {
    if (options.signal.aborted) return { go: false, cancelled: true };
    return { go: false, failed: err instanceof Error && err.message ? err.message : 'Try again in a moment.' };
  }
  return options.signal.aborted ? { go: false, cancelled: true } : { go: true };
}
