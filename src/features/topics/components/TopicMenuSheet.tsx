import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Sheet, type SheetHandle } from '@/components/Sheet';
import { color, font, radius, space } from '@/theme/theme';

type Props = {
  sheetRef: React.RefObject<SheetHandle | null>;
  topicTitle: string;
  onRename: () => void;
  onDelete: () => void;
};

/** The ⋯ menu: Rename topic, Delete topic, Cancel. Closes itself before running either. */
export function TopicMenuSheet({ sheetRef, topicTitle, onRename, onDelete }: Props) {
  const closeThen = (action: () => void) => () => {
    sheetRef.current?.close();
    action();
  };
  return (
    <Sheet ref={sheetRef}>
      <View style={styles.root}>
        <Text style={styles.title} numberOfLines={1}>
          {topicTitle.toUpperCase()}
        </Text>
        <Pressable onPress={closeThen(onRename)} style={[styles.item, styles.itemRule]} accessibilityRole="button" accessibilityLabel="Rename topic">
          <Icon name="edit" size={20} color={color.primary} />
          <Text style={styles.itemLabel}>Rename topic</Text>
        </Pressable>
        <Pressable onPress={closeThen(onDelete)} style={styles.item} accessibilityRole="button" accessibilityLabel="Delete topic">
          <Icon name="delete" size={20} color={color.rust} />
          <Text style={[styles.itemLabel, { color: color.rust }]}>Delete topic</Text>
        </Pressable>
        <Pressable onPress={() => sheetRef.current?.close()} style={styles.cancel} accessibilityRole="button" accessibilityLabel="Cancel">
          <Text style={styles.cancelLabel}>Cancel</Text>
        </Pressable>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: space.gutter, paddingBottom: 18 },
  title: { fontFamily: font.eyebrow, fontSize: 11, letterSpacing: 0.9, color: color.inkMuted, paddingVertical: 8 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 54 },
  itemRule: { borderBottomWidth: 1, borderBottomColor: color.rule },
  itemLabel: { fontFamily: font.rowTitle, fontSize: 16, color: color.ink },
  cancel: { marginTop: 8, minHeight: 50, borderRadius: radius.field, borderWidth: 1, borderColor: color.line, alignItems: 'center', justifyContent: 'center' },
  cancelLabel: { fontFamily: font.rowTitle, fontSize: 15, color: color.ink },
});
