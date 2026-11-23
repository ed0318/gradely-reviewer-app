import { useEffect } from 'react';
import { BackHandler } from 'react-native';

/** Android's back steps back through a multi-step screen instead of closing the app. */
export function useBackThroughSteps(canStepBack: boolean, stepBack: () => void): void {
  useEffect(() => {
    if (!canStepBack) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      stepBack();
      return true;
    });
    return () => subscription.remove();
  }, [canStepBack, stepBack]);
}
