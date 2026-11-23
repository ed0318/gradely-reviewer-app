import { useEffect, useRef } from 'react';

/** False once the component has unmounted, so an async handler never sets state after it. */
export function useIsMountedRef() {
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  return isMountedRef;
}
