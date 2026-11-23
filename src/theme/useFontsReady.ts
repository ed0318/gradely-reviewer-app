import { useEffect, useState } from 'react';
import { getLoadedFonts, loadAsync } from 'expo-font';
import { font } from './theme';

/**
 * True once the Gradely faces can be drawn.
 *
 * The fonts are built into the app by expo-font's plugin (app.json), so a
 * native build has them before the first frame and this is true at once. A
 * dev client built before the plugin was added has none; there, and only in
 * development, they are loaded the old way. The `require`s sit inside
 * `if (__DEV__)` so a release bundle never packs a second copy.
 */
export function useFontsReady(): boolean {
  const [isReady, setIsReady] = useState(() => !__DEV__ || getLoadedFonts().includes(font.title));

  useEffect(() => {
    if (isReady) return;
    let isMounted = true;
    if (__DEV__) {
      void loadAsync({
        BricolageGrotesque_600SemiBold: require('@expo-google-fonts/bricolage-grotesque/600SemiBold/BricolageGrotesque_600SemiBold.ttf'),
        ZillaSlab_600SemiBold: require('@expo-google-fonts/zilla-slab/600SemiBold/ZillaSlab_600SemiBold.ttf'),
        ZillaSlab_700Bold: require('@expo-google-fonts/zilla-slab/700Bold/ZillaSlab_700Bold.ttf'),
        PublicSans_400Regular: require('@expo-google-fonts/public-sans/400Regular/PublicSans_400Regular.ttf'),
        PublicSans_400Regular_Italic: require('@expo-google-fonts/public-sans/400Regular_Italic/PublicSans_400Regular_Italic.ttf'),
        PublicSans_500Medium: require('@expo-google-fonts/public-sans/500Medium/PublicSans_500Medium.ttf'),
        PublicSans_600SemiBold: require('@expo-google-fonts/public-sans/600SemiBold/PublicSans_600SemiBold.ttf'),
        PublicSans_700Bold: require('@expo-google-fonts/public-sans/700Bold/PublicSans_700Bold.ttf'),
        JetBrainsMono_500Medium: require('@expo-google-fonts/jetbrains-mono/500Medium/JetBrainsMono_500Medium.ttf'),
        JetBrainsMono_600SemiBold: require('@expo-google-fonts/jetbrains-mono/600SemiBold/JetBrainsMono_600SemiBold.ttf'),
        Kalam_400Regular: require('@expo-google-fonts/kalam/400Regular/Kalam_400Regular.ttf'),
      })
        // A font that will not load must not keep the splash up: text falls back to the system face.
        .catch((error: unknown) => console.warn('[reviewer] fonts failed to load', error))
        .finally(() => {
          if (isMounted) setIsReady(true);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isReady]);

  return isReady;
}
