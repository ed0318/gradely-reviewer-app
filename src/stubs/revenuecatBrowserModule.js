/**
 * Stands in for `react-native-purchases/dist/browser/nativeModule` on iOS and
 * Android (see metro.config.js). The only thing `purchases.js` reads from it is
 * `browserNativeModuleRNPurchases`, and only in browser mode (Expo Go, Rork,
 * the web), which a Gradely build never runs in.
 *
 * A plain value, not a getter that throws: in development Fast Refresh reads
 * every export of every module as it loads, so a throwing getter broke the
 * dev build even though RevenueCat itself never touched it. In browser mode
 * purchases would fail inside RevenueCat, and `src/api/billing.ts` already
 * reports an SDK it cannot use as purchases being unavailable.
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.browserNativeModuleRNPurchases = undefined;
