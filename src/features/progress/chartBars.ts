/** How many attempts the chart draws. */
export const CHART_BAR_COUNT = 6;
/** The chart's drawing height, and the height of a 100% bar inside it. */
export const CHART_HEIGHT = 92;
const FULL_BAR_HEIGHT = 80;
const MAX_BAR_WIDTH = 44;
const BAR_GAP = 12;

export type ChartInput = { attemptNumber: number; percent: number };
export type ChartBar = { attemptNumber: number; percent: number; x: number; width: number; height: number; isLatest: boolean };

/**
 * Where each bar goes, oldest to newest from the left, in a chart `width` wide.
 * Bars share the width up to 44 wide with 12 between them, as in the mockup, so
 * one bar is not stretched across the whole chart. The last bar is the latest.
 */
export function layoutChartBars(inputs: readonly ChartInput[], width: number): ChartBar[] {
  const count = inputs.length;
  if (count === 0 || width <= 0) return [];
  const barWidth = Math.max(8, Math.min(MAX_BAR_WIDTH, (width - BAR_GAP * (count - 1)) / count));
  return inputs.map((input, index) => {
    const percent = Math.min(100, Math.max(0, input.percent));
    return {
      attemptNumber: input.attemptNumber,
      percent: input.percent,
      x: index * (barWidth + BAR_GAP),
      width: barWidth,
      height: Math.round(percent * (FULL_BAR_HEIGHT / 100)),
      isLatest: index === count - 1,
    };
  });
}

/** The spoken version of the chart: "Scores for the last 3 attempts: 80, 85, 90 percent". */
export function describeChart(inputs: readonly ChartInput[]): string {
  return `Scores for the last ${inputs.length} ${inputs.length === 1 ? 'attempt' : 'attempts'}: ${inputs.map((input) => input.percent).join(', ')} percent`;
}
