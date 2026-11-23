// Dev-only: the [boot] line's clock starts here, before any other module runs
// (src/lib/bootClock.ts imports nothing, so tablet sizing still comes next).
import './src/lib/bootClock';
// Tablet sizing has to be in place before any screen creates a stylesheet —
// see src/layout/tabletScale.ts. Everything else starts as Expo Router does.
import './src/layout/tabletScale';
import 'expo-router/entry';
