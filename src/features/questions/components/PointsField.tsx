import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { LabeledField } from './LabeledField';
import { parsePoints } from '../questionRules';

/**
 * POINTS. Typed as text, so the box can be empty or half-typed ("2.") without
 * snapping back; only a number that means something is passed on (else 0,
 * which "Needs points" then flags). Mount it keyed by question so it starts
 * from that question's points.
 */
export function PointsField({ initialPoints, onChangePoints }: { initialPoints: number; onChangePoints: (value: number) => void }) {
  const [text, setText] = useState(String(initialPoints));
  return (
    <View style={styles.root}>
      <LabeledField
        label="POINTS"
        value={text}
        onChangeText={(next) => {
          setText(next);
          onChangePoints(parsePoints(next));
        }}
        keyboardType="decimal-pad"
        isMono
      />
    </View>
  );
}

const styles = StyleSheet.create({ root: { width: 120 } });
