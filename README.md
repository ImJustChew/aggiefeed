# AggieFeed

AggieFeed is an Expo SDK 57 + TypeScript mobile reader for the public AggieFeed activity API. It loads a list of activities and opens each one in a detail screen.

## Libraries

- `expo-router` — file-based navigation.
- `@tanstack/react-query` — server-state fetching and caching.
- `react-native-reanimated` — performant motion.
- `expo-web-browser` — in-app links.
- `expo-font` with `@expo-google-fonts/inter` and `@expo-google-fonts/newsreader` — app typography.
- `react-native-safe-area-context` — safe-area layout.
- `jest-expo` + `@testing-library/react-native` — unit and component tests.
- ESLint, Prettier, and knip — quality and dead-code checks.

## Run it

Requirements:

- Node.js 20.19.4+, 22.13+, or 24.3+ (React Native 0.86 requirement).
- [Bun](https://bun.sh).
- Expo Go for SDK 57, or an Android emulator / iOS simulator.
- Network access to the public AggieFeed API.


```sh
git clone <repo-url>
cd aggiefeed-interview
bun install
bun run start
```

Press `a` for Android, `i` for iOS, or scan the QR code with Expo Go. You can also start a platform directly:

```sh
bun run android
bun run ios
```

## Checks

```sh
bun run check
bun run test
```

`bun run check` runs typecheck, lint, knip, and tests in sequence. Individual scripts are `bun run typecheck`, `bun run lint`, and `bun run knip`.

## Requirements coverage

- The list shows `title` and `actor.displayName` in `src/components/FeedItem.tsx`.
- The list uses Reanimated's `Animated.FlatList` in `src/screens/FeedScreen.tsx`.
- Loading, API error, retry, and empty states are explicit in `src/hooks/useActivities.ts` and `src/components/StatusView.tsx`.
- The first screen-load request is exactly `?s=0&l=25`, from `src/api/aggieFeed.ts`.
- Details show `title`, `actor.displayName`, `object.objectType`, and `published`; native back navigation is provided by the Expo Router stack in `src/app/`.
- `ApiActivity` and normalized `Activity` types cover the API model without `any` reliance (`src/api/types.ts`, `src/domain/activity.ts`).
- Missing fields become readable fallbacks such as `Untitled`, `Unknown source`, and `Date unavailable` (`src/ui/activityPresentation.ts`).

## Optional enhancements

Implemented: pull-to-refresh, basic unit tests, basic component tests, date formatting, improved visual styling, accessibility labels, light/dark mode, Retry button on API error, and TanStack React Query.

## Beyond the requirements

- **Infinite scroll.** Loads 25-item pages after the exact `s=0&l=25` first request and stops at the API's `skip` cap of 4000, short pages, or exhausted data.
- **Server search.** The header search toggle sends debounced `q` searches with a 350 ms debounce; server matching remains a limit.
- **News/Events tabs.** Filters on the client because the API has no type filter, using a bounded page fill for sparse results.
- **Tappable summary links.** Preserves and opens `http(s)` links in summaries; other formatting is flattened.
- **Collapsing header and motion.** Reanimated handles scroll, presses, reveals, and loading; timed effects respect reduced motion, while header collapse remains scroll-linked.
- **Newsreader/Inter typography and Aggie blue/gold icon.** Uses bundled fonts and configured icon assets; a font-load failure is non-fatal.
- **Event When/Where.** Shows normalized date and location; missing values use readable fallbacks, and event times use the device's local time.
- **Cache-aware detail route.** Reads cached lists first, then fetches the default first page on a miss; unknown IDs show `Activity not found`.

## Project structure

```text
src/
├── api/          HTTP client, wire types, and API tests
├── domain/       normalization and pure data/text/date helpers
├── hooks/        TanStack Query, pagination, search, and header state
├── components/   reusable feed, search, status, and motion UI
├── screens/      feed and activity detail presentation
├── app/          Expo Router entry points and routes
├── integration/  router flow tests
├── lib/          shared QueryClient configuration
├── theme/        colors, fonts, and spacing
└── ui/           display labels, fallback copy, and activity formatting
```

Routes in `src/app/` stay thin and wire hooks to screens; screens/components render; hooks own data fetching via TanStack Query; `api` fetches and hands the raw JSON to `domain` for parsing; `domain` is pure and framework-free.

## Tests

- Domain/API unit tests cover requests, parsing, missing data, links, dates, and filtering.
- Hook tests cover loading, errors, refresh, search, pagination, sparse filters, and detail lookup.
- Component/screen tests cover feed controls, list states, activity details, links, and event metadata.
- Router integration covers list → detail → back, error → Retry, empty, search, Events, and unknown IDs.

## Assumptions & limitations

- Any API field may be missing, so parsing is defensive.
- News/Events filtering is client-side because the API has no type filter.
- The API accepts only `s`, `l`, and `q`; `skip` is capped at 4000 and `limit` at 500.
- Server order is preserved. A story from two sources can appear twice when the records have different IDs.
- React Query uses an in-memory cache only; there is no offline persistence.
- Summaries keep links but not other formatting.
- In Expo Go on Android, closing the in-app browser can return to Expo Go's home instead of the app. The app is still running; this is not an issue in standalone builds.
- Manually tested on an Android emulator; not tested on a physical iOS device.

## Troubleshooting

For an Android emulator that cannot reach Metro, often because of a VPN or multiple network interfaces:

macOS/Linux (`sh`):

```sh
adb reverse tcp:8081 tcp:8081
REACT_NATIVE_PACKAGER_HOSTNAME=127.0.0.1 bun run start
```

Windows (PowerShell):

```powershell
$env:REACT_NATIVE_PACKAGER_HOSTNAME = "127.0.0.1"
adb reverse tcp:8081 tcp:8081
bun run start
```

Open `exp://127.0.0.1:8081` in Expo Go.

## AI assistance

This project was built with AI coding assistants. AGENTS.md holds the project guidelines they followed.
