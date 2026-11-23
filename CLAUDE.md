@AGENTS.md

# Gradely Reviewer app

Offline-first Expo app where students and reviewees write their own topics and questions, take exams
(0.25 credit per item) and track progress. Topics, questions, exams and attempts live on the phone in
SQLite; the reviewer API holds only the account and the credits. The build plan is
`../REVIEWER_KICKOFF.md`; work one phase at a time.

Same stack and look as `../gradely-app` (Expo SDK 57, React Native 0.86, React 19.2, TypeScript strict,
expo-router), so code and fixes move between the two. The theme in `src/theme` is copied from it.

## Commands

- `npm run typecheck` · `npm run lint` · `npm test` — all three pass before every commit.
- `npx expo run:ios` / `npx expo run:android` — build and run the dev client (no Expo Go: native modules).
- Changing `app.json`, `app.config.js` or a native package needs a new dev client build.

## Folder structure

```text
app/                  routes only; screens are layout + hooks
src/api/              network calls only, one file per server area (client, auth, credits, purchases, handover)
src/db/               client (one shared connection), schema, migrations/, repositories/ (the only place SQL lives)
src/features/<name>/  components/, hooks/, actions.ts (topics, questions, exams, progress, credits, account)
src/components/       shared UI (Button, TextField, Sheet, SegmentedControl, Toast, EmptyState, Splash)
src/theme/            color, font, radius, space, press
src/state/            small, split providers (AccountProvider, CreditsProvider)
src/notifications/    scheduling and cancelling local reminders
src/lib/              small pure modules (formatCredits, ids, dates)
```

## Coding standards

**Naming.** Names say what a thing does or holds.
- Components: one PascalCase file per component (`QuestionRow.tsx`). Hooks: `useTopicQuestions.ts`.
  Other modules: camelCase named for their job (`creditCost.ts`, `scoreAttempt.ts`).
- Functions start with a verb (`createExamOnServer`, `listQuestionsByTopic`). Booleans read as
  questions (`isOffline`, `hasEnoughCredits`).
- Banned names: `data`, `info`, `temp`, `handleStuff`, `utils.ts`, `helpers.ts`.

**Components.**
- One component per file, about 200 lines at most. A screen is layout plus hooks.
- Logic lives in hooks and `actions.ts`; SQL only in `src/db/repositories`; network only in `src/api`.
- Typed props, no business logic inline in JSX. Shared pieces in `src/components`, feature pieces stay in
  their feature.
- List rows are `React.memo` with stable `key`s and `useCallback` handlers.

**Memory leaks and performance.**
- Every `useEffect` that subscribes or starts a timer returns a cleanup: AppState, network status,
  notification listeners, the RevenueCat listener, keyboard listeners, timers, animations.
- Abort in-flight requests on unmount (`AbortController`) and ignore late results; never set state after
  unmount.
- The exam timer is one interval, cleared on unmount and when the app goes to background.
- Long lists use FlashList, never `ScrollView` + `map`.
- SQLite: one shared connection (`openDatabase` in `src/db/client.ts`, WAL and foreign keys on, migrated at
  open). Every write goes through `queueWrite`; a repository function that writes several rows opens its
  own `withTransactionAsync`, so callers never nest one. An index on every foreign key, `LIMIT`/`OFFSET`
  paging, read only what the screen shows.
- Profile photo: resize to about 512 px when picked and store the file path, never base64.
- Keep providers small and split; derive values with `useMemo`; never put the whole database in React state.

**Credits.** Integer units everywhere: 1 credit = 4 units, 1 exam item = 1 unit (0.25 credit;
`UNITS_PER_EXAM_ITEM`, which must match what reviewer-api charges). Convert to credits only
for display (`formatCredits` in `src/lib/creditUnits.ts`). Never floats.

**Security.**
- Tokens in `expo-secure-store` only, never AsyncStorage.
- No secret keys in the app: `EXPO_PUBLIC_` values are readable by anyone with the app. Only RevenueCat
  public SDK keys (`appl_…`, `goog_…`); `app.config.js` refuses a production build with an `sk_` key.
- The server decides credits and purchases. Every charge carries an idempotency key (`expo-crypto`
  `randomUUID`).

**API.** Every call goes through `requestResult` / `requestList` in `src/api/client.ts` (bearer token, one
shared refresh on a 401, timeout). Area files (`auth`, `credits`, `purchases`, `handover`, `appVersion`)
map the server's snake_case to camelCase types; nothing outside `src/api` sees a raw payload. The contract
is reviewer-api's `routes/api.php` and `app/Http/Resources`; the base URL ends in `/v1`.

**Errors and states.** Calls throw `OfflineError` (no answer), `ApiError` (refused; switch on its `code`,
never the message) or `RequestCancelledError` (the caller aborted; ignore it). Pass an `AbortSignal` from
the effect's cleanup. Listen for a refused session with `subscribeToSessionEnd`. Every screen handles
loading, empty, error and offline.

**Accessibility.** 44 pt touch targets, `accessibilityLabel` on icon buttons, text contrast 4.5:1 or more
(the palette already passes).

**Database.** Repositories in `src/db/repositories` take the `SQLiteDatabase` as their first argument and
hold all SQL; the shapes they return are in `src/db/records.ts`. Ids are UUID text, times are epoch ms.
Schema changes are a new numbered file in `src/db/migrations` added to `MIGRATIONS`; never edit a shipped
migration. Topics and questions mirror gradely-app's exam tables column for column.

**Account and session.** `src/state/AccountProvider.tsx` holds the session (`loading`, `signed_out`,
`handover`, `signed_in`); `src/features/account/session.ts` does the steps (restore at launch without the
network, establish after sign-in, the phone-owner check, the hand-over erase). The root layout routes with
`Stack.Protected` on that state. One phone holds one person's topics: a different account on a phone with
data always goes to `app/handover.tsx`. The profile photo stays on the phone (path relative to the
document folder); the name is saved to the server first.

**Tests.** Vitest for pure logic (credit cost, scoring, paging) and for repositories on `better-sqlite3`
(`src/**/*.test.ts`). Repository tests use `openMigratedMemoryDatabase()` from `src/db/testing`, which app
code never imports.

**Git.** Feature branches merged into the `dev-server` integration branch, as in Gradely. Never commit
`.env`.
