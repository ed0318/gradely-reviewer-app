import { useCallback, useRef } from 'react';

/**
 * Keeps one swiped-open row at a time: a row that is opening calls the
 * returned function with its own `close`, and the row that was open closes.
 */
export function useSingleOpenSwipe() {
  const closeOpenRowRef = useRef<(() => void) | null>(null);
  return useCallback((closeThisRow: () => void) => {
    if (closeOpenRowRef.current && closeOpenRowRef.current !== closeThisRow) closeOpenRowRef.current();
    closeOpenRowRef.current = closeThisRow;
  }, []);
}
