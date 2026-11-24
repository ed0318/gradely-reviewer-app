import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { UNITS_PER_EXAM_ITEM, formatCredits } from '@/lib/creditUnits';
import { color, font, radius } from '@/theme/theme';

type Props = {
  itemsText: string;
  creditsForItems: string;
  /** Null until a pack is chosen. */
  packCredits: number | null;
  itemsInPack: number;
  onChangeItemsText: (text: string) => void;
  onStep: (direction: 1 | -1) => void;
};

function StepButton({ label, direction, onPress }: { label: string; direction: 1 | -1; onPress: (direction: 1 | -1) => void }) {
  return (
    <Pressable onPress={() => onPress(direction)} style={styles.step} accessibilityRole="button" accessibilityLabel={label}>
      {direction === 1 ? <Icon name="add" size={20} color={color.primary} /> : <Text style={styles.minus}>−</Text>}
    </Pressable>
  );
}

/** "What an exam costs": items typed or stepped, the credits they use, and what the chosen pack is worth in items. */
export function ItemsCalculator({ itemsText, creditsForItems, packCredits, itemsInPack, onChangeItemsText, onStep }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.heading} accessibilityRole="header">
          WHAT AN EXAM COSTS
        </Text>
        <Text style={styles.rate}>1 item = {formatCredits(UNITS_PER_EXAM_ITEM)} credit</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.stepper}>
          <StepButton label="Fewer items" direction={-1} onPress={onStep} />
          <TextInput
            value={itemsText}
            onChangeText={onChangeItemsText}
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={3}
            selectTextOnFocus
            accessibilityLabel="Number of items"
            style={styles.input}
          />
          <StepButton label="More items" direction={1} onPress={onStep} />
        </View>
        <Text style={styles.items}>items</Text>
        <Text style={styles.equals} accessibilityElementsHidden importantForAccessibility="no">
          =
        </Text>
        <View style={styles.result} accessibilityRole="text" accessibilityLiveRegion="polite" accessibilityLabel={`${creditsForItems} credits`}>
          <Text style={styles.resultAmount}>{creditsForItems}</Text>
          <Text style={styles.resultUnit}> credits</Text>
        </View>
      </View>
      {packCredits !== null && (
        <Text style={styles.packLine}>
          The {packCredits.toLocaleString('en-US')}-credit pack = <Text style={styles.packItems}>{itemsInPack.toLocaleString('en-US')}</Text> items
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: color.line, borderRadius: radius.card, overflow: 'hidden', backgroundColor: color.surface },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: color.paper },
  heading: { fontFamily: font.eyebrow, fontSize: 11, letterSpacing: 0.7, color: color.inkMuted },
  rate: { fontFamily: font.mono, fontSize: 11, color: color.inkMuted },
  body: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, paddingVertical: 14, paddingHorizontal: 12 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  step: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.field, borderWidth: 1, borderColor: color.line, backgroundColor: color.surface },
  minus: { fontFamily: font.monoStrong, fontSize: 24, lineHeight: 28, color: color.primary },
  input: { width: 64, height: 44, textAlign: 'center', borderRadius: radius.field, borderWidth: 1.5, borderColor: color.primary, backgroundColor: color.surface, fontFamily: font.monoStrong, fontSize: 18, color: color.ink, padding: 0 },
  items: { fontFamily: font.uiRegular, fontSize: 13, color: color.inkMuted },
  equals: { fontFamily: font.mono, fontSize: 18, color: color.inkMuted },
  result: { flexDirection: 'row', alignItems: 'baseline', marginLeft: 'auto', paddingVertical: 6, paddingHorizontal: 10, borderRadius: radius.field, backgroundColor: color.highlight },
  resultAmount: { fontFamily: font.monoStrong, fontSize: 20, color: color.ink },
  resultUnit: { fontFamily: font.uiRegular, fontSize: 12, color: color.ink },
  packLine: { paddingVertical: 10, paddingHorizontal: 12, borderTopWidth: 1, borderTopColor: color.rule, fontFamily: font.uiRegular, fontSize: 13, color: color.inkMuted },
  packItems: { fontFamily: font.monoStrong, color: color.ink },
});
