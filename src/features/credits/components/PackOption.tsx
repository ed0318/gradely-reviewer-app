import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CreditProduct } from '@/api/purchases';
import { color, font, radius } from '@/theme/theme';
import { formatPesos } from '../creditCalculator';

type Props = { product: CreditProduct; isPicked: boolean; isBestValue: boolean; isDisabled: boolean; onPick: (storeProductId: string) => void };

/** One credit pack as a radio row: "280 credits  Best value" and its price from the server. */
export const PackOption = memo(function PackOption({ product, isPicked, isBestValue, isDisabled, onPick }: Props) {
  const price = formatPesos(product.priceCentavos);
  return (
    <Pressable
      onPress={() => onPick(product.storeProductId)}
      disabled={isDisabled}
      accessibilityRole="radio"
      accessibilityState={{ checked: isPicked, disabled: isDisabled }}
      accessibilityLabel={`${product.credits} credits, ${price}${isBestValue ? ', best value' : ''}`}
      style={[styles.row, isPicked && styles.rowPicked]}
    >
      <View style={styles.left}>
        <Text style={styles.credits}>{product.credits.toLocaleString('en-US')}</Text>
        <Text style={styles.unit}>credits</Text>
        {isBestValue && (
          <View style={styles.tag}>
            <Text style={styles.tagText}>Best value</Text>
          </View>
        )}
      </View>
      <Text style={styles.price}>{price}</Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 6, paddingHorizontal: 16, borderRadius: radius.card, borderWidth: 1, borderColor: color.line, backgroundColor: color.surface },
  rowPicked: { borderWidth: 2, borderColor: color.primary, backgroundColor: color.primaryTint },
  left: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  credits: { fontFamily: font.monoStrong, fontSize: 22, color: color.ink },
  unit: { fontFamily: font.uiRegular, fontSize: 13, color: color.inkMuted },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: color.highlight },
  tagText: { fontFamily: font.eyebrow, fontSize: 11, color: color.ink },
  price: { fontFamily: font.title, fontSize: 24, color: color.ink },
});
