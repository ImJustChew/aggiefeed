# AggieFeed

AggieFeed is an Expo SDK 57 + TypeScript mobile reader for the public AggieFeed activity API. It loads a list of activities and opens each one in a detail screen.

Built with Expo Router, TanStack Query, and Reanimated.

## Run it

Requirements:

- Node.js 22.13+ or 24+.
- Bun.
- Expo Go for SDK 57, or an Android emulator / iOS simulator.
- Network access to the public AggieFeed API.

From the repository root:

```sh
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

## Spec coverage

- The list shows `title` and `actor.displayName` in `src/components/FeedItem.tsx`.
- The list uses Reanimated's `Animated.FlatList` in `src/screens/FeedScreen.tsx`.
- Loading, API error, retry, and empty states are explicit in `src/hooks/useActivities.ts` and `src/components/StatusView.tsx`.
- The first screen-load request is exactly `?s=0&l=25`, from `src/api/aggieFeed.ts`.
- Details show `title`, `actor.displayName`, `object.objectType`, and `published`; native back navigation is provided by the Expo Router stack in `src/app/`.
- `ApiActivity` and normalized `Activity` types cover the API model without `any` reliance (`src/api/types.ts`, `src/domain/activity.ts`).
- Missing fields become readable fallbacks such as `Untitled`, `Unknown source`, and `Date unavailable` (`src/ui/activityPresentation.ts`).

## Optional enhancements from the spec

Implemented: pull-to-refresh, basic unit tests, basic component tests, date formatting, improved visual styling, accessibility labels, light/dark mode, Retry button on API error, and TanStack React Query.

## Beyond the spec

- Infinite scroll — loads 25-item pages after the exact `s=0&l=25` first request; stops at the API's `skip` cap, short pages, or exhausted data.
- Server search — the header search toggle sends debounced `q` searches; the 350 ms debounce and server matching remain limits.
- News/Events tabs — filters on the client because the API has no type filter; sparse results use a bounded page fill.
- Tappable summary links — preserves and opens `http(s)` links in summaries; other formatting is flattened.
- Collapsing header and motion — Reanimated handles scroll, presses, reveals, and loading; timed effects respect reduced motion, while header collapse remains scroll-linked.
- Newsreader/Inter typography and Aggie blue/gold icon — bundled fonts and configured icon assets; a font-load error lets the app continue.
- Event When/Where — shows normalized date and location; missing values use readable fallbacks and times use the device's local time zone.
- Cache-aware detail route — checks cached lists first, then fetches the default first page on a miss; absent IDs show `Activity not found`.

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
└── ui/           activity display formatting
```

The layering is `api → domain → hooks → screens/components ← app routes`.

## Tests

- Domain/API unit tests cover requests, parsing, missing data, links, dates, and filtering.
- Hook tests cover loading, errors, refresh, search, pagination, sparse filters, and detail lookup.
- Component/screen tests cover feed controls, list states, activity details, links, and event metadata.
- Router integration covers list → detail → back, error → Retry, empty, search, Events, and unknown IDs. Tested on an Android emulator; no physical iOS device was used.

## Notes & limitations

- The API accepts only `s`, `l`, and `q`; `skip` is capped at 4000 and `limit` at 500.
- Server order is preserved. A story from two sources can appear twice when the records have different IDs.
- React Query uses an in-memory cache only; there is no offline persistence.
- Summaries keep links but not other formatting.
- In Expo Go on Android, closing the in-app browser can return to Expo Go's home instead of the app. The app is still running; this is not an issue in standalone builds.

## Troubleshooting

For an Android emulator that cannot reach Metro, often because of a VPN or multiple network interfaces:

```sh
adb reverse tcp:8081 tcp:8081
REACT_NATIVE_PACKAGER_HOSTNAME=127.0.0.1 bun run start
```

Open `exp://127.0.0.1:8081` in Expo Go. PowerShell: `$env:REACT_NATIVE_PACKAGER_HOSTNAME="127.0.0.1"; adb reverse tcp:8081 tcp:8081; bun run start`
