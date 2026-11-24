import React, { useEffect, useSyncExternalStore } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { getDummyStoreRequest, registerDummyStoreSheet, settleDummyStoreRequest, subscribeToDummyStoreRequest } from '@/api/mock/mockStoreSheetBridge';
import { color, font, radius } from '@/theme/theme';
import { formatPesos } from '../creditCalculator';

/**
 * DEV ONLY: stands in for the store's own purchase sheet while the dummy store
 * is on (see `src/api/mock/mockCreditStore.ts`): the pack, the price, Buy and
 * Cancel. Android's back button cancels. Render it only for the dummy store.
 */
export function DummyStoreSheet() {
  useEffect(() => registerDummyStoreSheet(), []);
  const request = useSyncExternalStore(subscribeToDummyStoreRequest, getDummyStoreRequest);
  return (
    <Modal visible={request !== null} transparent animationType="fade" statusBarTranslucent onRequestClose={() => settleDummyStoreRequest(false)}>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityViewIsModal>
          <Text style={styles.badge}>DUMMY STORE · DEV ONLY</Text>
          <Text style={styles.title}>{request ? `${request.credits.toLocaleString('en-US')} credits` : ''}</Text>
          <Text style={styles.price}>{request ? formatPesos(request.priceCentavos) : ''}</Text>
          <Text style={styles.note}>No money is taken. Buy makes a pretend purchase that the dummy server credits when the app asks.</Text>
          <Pressable style={[styles.action, styles.buy]} onPress={() => settleDummyStoreRequest(true)} accessibilityRole="button" accessibilityLabel="Buy">
            <Text style={styles.buyLabel}>Buy</Text>
          </Pressable>
          <Pressable style={styles.action} onPress={() => settleDummyStoreRequest(false)} accessibilityRole="button" accessibilityLabel="Cancel">
            <Text style={styles.cancelLabel}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(23, 34, 51, 0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 360, gap: 8, padding: 20, borderRadius: radius.sheet, backgroundColor: color.sheet },
  badge: { fontFamily: font.eyebrow, fontSize: 11, letterSpacing: 1, color: color.rust },
  title: { fontFamily: font.title, fontSize: 24, color: color.ink },
  price: { fontFamily: font.monoStrong, fontSize: 18, color: color.ink },
  note: { fontFamily: font.uiRegular, fontSize: 12.5, lineHeight: 18, color: color.inkMuted, marginBottom: 6 },
  action: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.field },
  buy: { backgroundColor: color.primary },
  buyLabel: { fontFamily: font.rowTitle, fontSize: 15, color: color.onPrimary },
  cancelLabel: { fontFamily: font.rowTitle, fontSize: 15, color: color.primary },
});
