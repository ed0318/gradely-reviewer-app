import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { BackHandler, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { color, radius } from '@/theme/theme';
import { SHEET_MAX, useLayout, useSystemInsets } from '@/layout/useLayout';

export type SheetHandle = { expand: () => void; close: () => void };

/**
 * Android's back closes an open sheet, and does nothing else.
 *
 * gorhom's sheet does not listen for back at all, so the press went straight
 * to the navigator: on the marking screen it left the screen with a score
 * half typed, and on a tab it switched to Today with the sheet still open
 * behind it. The latest listener runs first, so while a sheet is open this
 * one is ahead of the navigator's.
 */
export function useBackToClose(open: boolean, close: () => void) {
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeRef.current();
      return true;
    });
    return () => sub.remove();
  }, [open]);
}

type Props = {
  children: React.ReactNode;
  /** Told when the sheet opens and closes, however it was closed (drag, back, code). */
  onOpenChange?: (open: boolean) => void;
};

/**
 * Shared bottom-sheet chrome: backdrop, rounded sheet surface, drag handle. Feature sheets compose this and keep their own content/state.
 *
 * The sheet is exactly as tall as what is in it, and that is its only height.
 * It used to take a percentage as well, and gorhom's dynamic sizing (on by
 * default) added the content's height beside it: two resting places. A drag
 * could leave the score sheet at 62% of the window with Save and "Save and
 * next" below the bottom edge — the buttons the whole sheet is for.
 */
export const Sheet = forwardRef<SheetHandle, Props>(({ children, onOpenChange }, ref) => {
  const sheetRef = useRef<BottomSheet>(null);
  const { sheetInset, height } = useLayout();
  // A sheet reaches the bottom of the window, which on Android is under the navigation bar.
  const { top, bottom } = useSystemInsets();
  // The backdrop is mounted only while the sheet is, never at rest.
  // BottomSheetBackdrop renders at StyleSheet.absoluteFill over the whole screen
  // even at index -1, and starts with pointerEvents 'auto'. It only flips to
  // 'none' via a runOnJS hop guarded by an isMounted ref that a useEffect sets —
  // if that hop lands first the update is dropped, and the reaction never fires
  // again because the index never changes while the sheet stays closed. iOS hides
  // the damage because UIKit skips hit-testing views at alpha 0; Android happily
  // dispatches touches to a fully transparent view, so the closed backdrop ate
  // every tap and scroll on the whole screen.
  const [sheetOpen, setSheetOpen] = useState(false);
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;
  useEffect(() => {
    onOpenChangeRef.current?.(sheetOpen);
  }, [sheetOpen]);

  // Drop the backdrop on the caller's intent rather than on `onChange`. That
  // callback is the sheet telling us it has settled, and the comment above is
  // about updates from inside this library going missing — a backdrop whose
  // unmount depends on one is a backdrop that can outlive its sheet.
  const close = () => {
    setSheetOpen(false);
    sheetRef.current?.close();
  };
  useBackToClose(sheetOpen, close);

  useImperativeHandle(ref, () => ({
    expand: () => {
      setSheetOpen(true);
      sheetRef.current?.expand();
    },
    close,
  }));

  const backdrop = useMemo(
    () =>
      function Backdrop(props: any) {
        return <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />;
      },
    [],
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      enableDynamicSizing
      // Never taller than the window below the status bar.
      maxDynamicContentSize={height - top}
      enablePanDownToClose
      // Held to a centred width on a tablet; on a phone the inset is zero.
      style={{ marginHorizontal: sheetInset(SHEET_MAX) }}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
      backdropComponent={sheetOpen ? backdrop : undefined}
      onChange={(i) => setSheetOpen(i >= 0)}
    >
      {/* No flex here: a dynamically sized sheet measures its content, and a
          flexed view has no height of its own to measure. */}
      <BottomSheetView style={{ paddingBottom: bottom }}>{children}</BottomSheetView>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  sheetBg: { backgroundColor: color.sheet, borderRadius: radius.sheet, borderWidth: 1, borderColor: color.line },
  handle: { backgroundColor: color.overlayDivider, width: 38 },
});

Sheet.displayName = 'Sheet';
