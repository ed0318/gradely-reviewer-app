import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { isMockOfflineAvailable, setMockNetworkOffline, useMockNetworkOffline } from '@/api/mock/mockNetwork';
import { color, font, radius } from '@/theme/theme';

/** DEV ONLY: "Pretend there is no internet" for the dummy server. Draws nothing unless the dummy API is on in a development build. */
export function DevOfflineSwitch() {
  const isOffline = useMockNetworkOffline();
  if (!isMockOfflineAvailable) return null;
  return (
    <View style={styles.root}>
      <View style={styles.words}>
        <Text style={styles.title}>Dev: pretend there is no internet</Text>
        <Text style={styles.sub}>Makes the dummy server fail like a dropped connection. Development builds only.</Text>
      </View>
      <Switch value={isOffline} onValueChange={setMockNetworkOffline} trackColor={{ true: color.primary }} accessibilityLabel="Pretend there is no internet" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginTop: 16, borderRadius: radius.card, borderWidth: 1, borderStyle: 'dashed', borderColor: color.fieldBorder },
  words: { flex: 1, gap: 2 },
  title: { fontFamily: font.rowTitle, fontSize: 14, color: color.ink },
  sub: { fontFamily: font.uiRegular, fontSize: 12, color: color.inkMuted },
});
