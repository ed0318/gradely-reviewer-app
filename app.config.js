/**
 * app.json, plus what depends on the environment.
 *
 *  1. Google sign-in on iPhone: its plugin needs the iOS client id reversed as
 *     a URL scheme, derived here from EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID.
 *  2. A guard for store builds and updates: a release that points at a
 *     development or plain-http API, or carries a secret RevenueCat key, fails
 *     here rather than on a student's phone.
 *
 * Changing any of these needs a new native build (`npx expo prebuild`).
 */
module.exports = ({ config }) => {
  const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

  assertReleaseEnvironment();

  const plugins = (config.plugins ?? []).map((plugin) => {
    const name = Array.isArray(plugin) ? plugin[0] : plugin;
    if (name !== '@react-native-google-signin/google-signin' || !googleIosClientId) return plugin;

    // 1234-abc.apps.googleusercontent.com → com.googleusercontent.apps.1234-abc
    const iosUrlScheme = `com.googleusercontent.apps.${googleIosClientId.replace('.apps.googleusercontent.com', '')}`;
    return [name, { iosUrlScheme }];
  });

  return { ...config, plugins };
};

function assertReleaseEnvironment() {
  if (process.env.EAS_BUILD_PROFILE !== 'production' && process.env.REVIEWER_RELEASE !== '1') return;

  const api = process.env.EXPO_PUBLIC_API_URL ?? '';
  const problems = [];

  if (process.env.EXPO_PUBLIC_API_MOCK === '1') {
    problems.push('EXPO_PUBLIC_API_MOCK is on: the build would answer from the dummy server, not the real API.');
  }

  if (!/^https:\/\//i.test(api)) {
    problems.push('EXPO_PUBLIC_API_URL must be the public https address of the API.');
  } else if (/localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.|\.local\b/i.test(api)) {
    problems.push(`EXPO_PUBLIC_API_URL (${api}) is a development address.`);
  }

  // EXPO_PUBLIC_ values are inlined into the bundle: only public SDK keys belong here.
  for (const name of ['EXPO_PUBLIC_REVENUECAT_ANDROID_KEY', 'EXPO_PUBLIC_REVENUECAT_IOS_KEY']) {
    const key = process.env[name];
    if (key && /^sk_/i.test(key)) {
      problems.push(`${name} is a RevenueCat SECRET key (sk_…). Use the public SDK key (appl_… / goog_…) and rotate this one.`);
    } else if (key && /^test_/i.test(key)) {
      problems.push(`${name} is a RevenueCat Test Store key, which takes no money. Use the real store's public key.`);
    }
  }

  if (problems.length > 0) {
    throw new Error(`Refusing to make a production build or update:\n - ${problems.join('\n - ')}`);
  }
}
