import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** False while the app is in the background or switching away. The listener is removed on unmount. */
export function useIsAppActive(): boolean {
  const [isActive, setIsActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => setIsActive(state === 'active'));
    return () => subscription.remove();
  }, []);
  return isActive;
}
