import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import { color, font, radius } from '@/theme/theme';
import { CHART_BAR_COUNT, CHART_HEIGHT, describeChart, layoutChartBars, type ChartBar, type ChartInput } from '../chartBars';

const OLDER_BAR = '#8FB2D6';
const SIDE_PADDING = 4;
const GRID_STEP = 23;
const LABEL_GAP = 3;

/** A bar with square bottom corners and rounded top ones, as one path. */
function barPath(bar: ChartBar): string {
  const top = CHART_HEIGHT - bar.height;
  const r = Math.min(3, bar.height, bar.width / 2);
  const right = bar.x + bar.width;
  return `M${bar.x} ${CHART_HEIGHT}V${top + r}Q${bar.x} ${top} ${bar.x + r} ${top}H${right - r}Q${right} ${top} ${right} ${top + r}V${CHART_HEIGHT}Z`;
}

/** The last six scores as bars, the latest in navy. `inputs` run oldest to newest. */
export function ScoreChart({ inputs, tries }: { inputs: ChartInput[]; tries: number }) {
  const [width, setWidth] = useState(0);
  const handleLayout = useCallback((event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width), []);
  const bars = useMemo(() => layoutChartBars(inputs, width - SIDE_PADDING * 2), [inputs, width]);
  const title = tries > CHART_BAR_COUNT ? `Last ${CHART_BAR_COUNT} attempts` : 'Score per attempt';

  return (
    <View style={styles.root} accessible accessibilityRole="image" accessibilityLabel={describeChart(inputs)}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.plot} onLayout={handleLayout}>
        {width > 0 && (
          <>
            <Svg width={width} height={CHART_HEIGHT} style={StyleSheet.absoluteFill}>
              {Array.from({ length: Math.floor(CHART_HEIGHT / GRID_STEP) + 1 }, (_, index) => {
                const y = CHART_HEIGHT - index * GRID_STEP - 0.5;
                return <Line key={index} x1={0} x2={width} y1={y} y2={y} stroke={color.ruling} strokeWidth={1} />;
              })}
              <Path d={bars.map(barPath).join('')} fill={OLDER_BAR} transform={`translate(${SIDE_PADDING} 0)`} />
              {bars.length > 0 && <Path d={barPath(bars[bars.length - 1])} fill={color.primary} transform={`translate(${SIDE_PADDING} 0)`} />}
            </Svg>
            {bars.map((bar) => (
              <Text
                key={bar.attemptNumber}
                style={[styles.percent, { left: SIDE_PADDING + bar.x, width: bar.width, bottom: bar.height + LABEL_GAP }, bar.isLatest && styles.latest]}
              >
                {bar.percent}%
              </Text>
            ))}
          </>
        )}
      </View>
      <View style={styles.numbers}>
        {bars.map((bar) => (
          <Text key={bar.attemptNumber} style={[styles.number, { left: SIDE_PADDING + bar.x, width: bar.width }]}>
            #{bar.attemptNumber}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 6, paddingTop: 10, paddingBottom: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: color.line, borderRadius: radius.card, backgroundColor: color.surface },
  title: { fontFamily: font.rowTitle, fontSize: 13, color: color.ink },
  plot: { height: CHART_HEIGHT },
  percent: { position: 'absolute', textAlign: 'center', fontFamily: font.monoStrong, fontSize: 10, color: color.inkMuted },
  latest: { color: color.primary },
  numbers: { height: 14 },
  number: { position: 'absolute', textAlign: 'center', fontFamily: font.uiRegular, fontSize: 10, color: color.inkMuted },
});
