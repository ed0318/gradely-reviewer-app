import { useCallback, useEffect, useState } from 'react';
import { openDatabase } from '@/db/client';

export type DatabaseStatus = 'opening' | 'ready' | 'failed';

/** Opens the shared SQLite connection at launch, with a retry for the error state. */
export function useDatabaseReady(): { status: DatabaseStatus; retryOpen: () => void } {
  const [status, setStatus] = useState<DatabaseStatus>('opening');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let isMounted = true;
    openDatabase()
      .then(() => {
        if (isMounted) setStatus('ready');
      })
      .catch((error: unknown) => {
        console.warn('[reviewer] database failed to open', error);
        if (isMounted) setStatus('failed');
      });
    return () => {
      isMounted = false;
    };
  }, [attempt]);

  const retryOpen = useCallback(() => {
    setStatus('opening');
    setAttempt((count) => count + 1);
  }, []);

  return { status, retryOpen };
}
