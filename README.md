# AggieFeed

AggieFeed is an Expo SDK 57 React Native app written in TypeScript. It fetches public
AggieFeed Activity Streams data, renders it in an animated list, and opens a detail route for
each activity. The required feed/detail flow is documented first, followed by the optional
enhancements from the specification and additional enhancements.

## Quick start

Requirements:

- Node.js 22.13+ or Node.js 24+.
- Bun.
- Expo Go for SDK 57 on a physical device, or an Android emulator / iOS simulator.
- Network access to the public AggieFeed endpoint.

Install from the repository root:

```sh
bun install
```

Start the Expo development server:

```sh
bun run start
```

In the Expo CLI, press `a` for Android, press `i` for iOS, or scan the QR code with Expo Go.

Platform-specific start commands are also available:

```sh
bun run android
bun run ios
```

`bun run android` requires an available Android emulator or connected device. `bun run ios`
requires an available iOS simulator.

## Quality checks

- `bun run typecheck` — runs TypeScript with `tsc --noEmit`.
- `bun run lint` — runs the Expo ESLint configuration.
- `bun run test` — runs the Jest test suite.
- `bun run knip` — checks for unused files, exports, and dependencies.
- `bun run check` — runs typecheck, lint, knip, and test in sequence.
- `bun run format` — formats the repository with Prettier.

## Specification coverage

| Specification requirement                     | How it is met                                                                                                                                                                              | File path(s)                                                                                            |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| React Native and TypeScript                   | The app uses Expo with React Native screens and strict TypeScript configuration.                                                                                                           | `package.json`, `tsconfig.json`, `src/`                                                                 |
| Public AggieFeed API                          | The app requests `https://aggiefeed.ucdavis.edu/api/v1/activity/public`.                                                                                                                   | `src/api/aggieFeed.ts`                                                                                  |
| Main list fields                              | Each item shows the normalized `title` and `actor.displayName`; the latter is rendered as the source/byline.                                                                               | `src/components/FeedItem.tsx`, `src/ui/activityPresentation.ts`                                         |
| Appropriate list component                    | The feed uses Reanimated's animated `Animated.FlatList`, with stable activity IDs as keys.                                                                                                 | `src/screens/FeedScreen.tsx`                                                                            |
| Loading, error, and empty states              | Loading skeleton, retryable errors, empty-feed copy, and filtered/search no-results states are rendered explicitly.                                                                        | `src/hooks/useActivities.ts`, `src/components/StatusView.tsx`, `src/screens/FeedScreen.tsx`             |
| Fetch on main-screen load                     | The initial infinite-query page starts at skip `0` with limit `25`, producing `s=0&l=25`.                                                                                                  | `src/api/aggieFeed.ts`, `src/hooks/useActivities.ts`                                                    |
| Detail screen fields                          | The detail screen shows title, `actor.displayName` as “By”, formatted `object.objectType` in the Type row, and `published`. For example, `notification` becomes “Notification” in Details. | `src/screens/ActivityScreen.tsx`, `src/ui/activityPresentation.ts`                                      |
| Back navigation                               | Expo Router's stack provides normal mobile back navigation from `/activity/[id]` to the feed.                                                                                              | `src/app/_layout.tsx`, `src/app/index.tsx`, `src/app/activity/[id].tsx`                                 |
| TypeScript types for the four required fields | `ApiActivity` describes the optional wire fields; `Activity` stores the normalized title, source, object type, and published date.                                                         | `src/api/types.ts`, `src/domain/activity.ts`, `src/domain/parseActivities.ts`                           |
| No `any` reliance                             | The source contains no explicit `any`; ESLint treats `@typescript-eslint/no-explicit-any` as an error.                                                                                     | `eslint.config.js`, `src/`                                                                              |
| Missing-data handling                         | Untrusted payloads are validated, non-object entries are skipped, missing values become `null`, and the UI uses readable fallbacks such as “Untitled” and “Date unavailable”.              | `src/domain/parseActivities.ts`, `src/ui/activityPresentation.ts`, `src/components/StatusView.tsx`      |
| Usable mobile UX                              | Layouts use safe areas, readable spacing and typography, minimum 44-point controls, accessible labels, and light/dark palettes.                                                            | `src/screens/FeedScreen.tsx`, `src/screens/ActivityScreen.tsx`, `src/components/`, `src/theme/index.ts` |

## Optional enhancements from the specification

All nine optional enhancements are implemented:

- **Pull-to-refresh** — `Animated.FlatList` calls `reload`, which trims cached pages to the first page and refetches. `src/screens/FeedScreen.tsx`, `src/hooks/useActivities.ts`.
- **Basic unit tests** — API, parsing, date, text, activity, and hook behavior have Jest tests. `src/api/__tests__/`, `src/domain/__tests__/`, `src/hooks/__tests__/`.
- **Basic component tests** — feed header, feed item, feed screen, and activity screen rendering are tested. `src/components/__tests__/`, `src/screens/__tests__/`.
- **Date formatting** — published dates use absolute and relative formatting; event dates use local date/range formatting. `src/domain/date.ts`, `src/ui/activityPresentation.ts`.
- **Improved visual styling** — Newsreader/Inter typography, spacing, separators, palettes, skeletons, and editorial feed/detail layouts are defined in the screens and theme. `src/theme/index.ts`, `src/screens/`, `src/components/`.
- **Accessibility labels** — Buttons, tabs, search, progress indicators, loading states, and feed items have roles, labels, hints, or live-region settings. `src/components/`, `src/screens/FeedScreen.tsx`.
- **Light and dark mode** — The device color scheme selects the corresponding palette, status bar, router theme, and system appearance. `src/theme/index.ts`, `src/app/_layout.tsx`, `app.json`.
- **Retry button on API error** — Initial errors, detail errors, and next-page errors expose retry actions. `src/components/StatusView.tsx`, `src/components/FeedFooter.tsx`, `src/hooks/useActivities.ts`.
- **React Query** — TanStack Query owns feed/detail caching, request state, cancellation signals, pagination, placeholder data, and refetching. `src/lib/queryClient.ts`, `src/hooks/useActivities.ts`.

## Additional enhancements beyond the specification

| Enhancement                   | What it does                                                                                                                                                                                        | Why it was added                                                                           | Limits                                                                                                                                                                                                                |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Infinite scroll               | Requests exactly `s=0&l=25` first, then 25 activities per page.                                                                                                                                     | Keeps the initial load small while allowing the feed to grow.                              | The API caps skip at `4000` and limit at `500`; this app keeps limit at 25, stops at the skip cap, and stops after a short page.                                                                                      |
| Server search                 | The header search toggle sends the debounced query as `q`; previous results stay visible while the next request is in flight and an indicator is shown.                                             | Uses the API's full-text search instead of downloading the entire feed for every search.   | The input debounce is 350 ms, and the server's search behavior remains authoritative.                                                                                                                                 |
| News and Events tabs          | Filters normalized activities on the client because the API has no type-filter parameter. Sparse tabs automatically request later pages, up to four extra pages.                                    | Makes the mixed feed easier to scan without changing the API contract.                     | Tabs can still contain fewer results when the feed is sparse, the API ends, or the four-page auto-fill limit is reached.                                                                                              |
| Collapsing header             | As the feed scrolls, the date line and subtitle collapse and fade, the AggieFeed wordmark scales down into a compact pinned bar, and the search button and News/Events tabs stay pinned and usable. | Preserves context at the top without taking the full viewport while reading.               | It is a visual scroll interaction; it does not change the data or navigation model.                                                                                                                                   |
| Editorial typography          | Loads Newsreader for display text and Inter for interface/body text before hiding the splash screen.                                                                                                | Separates headlines from utility text while keeping the UI readable.                       | Font loading depends on the bundled Expo font packages; a font error allows the app to continue.                                                                                                                      |
| Motion                        | Uses Reanimated for press feedback, reveals, skeleton loading, tab indicators, search transitions, and header collapse.                                                                             | Gives state changes and interactions visible feedback.                                     | Reduced motion disables or minimizes the timed animations (press feedback, reveals, skeleton pulse, tab indicator, search transition); the header collapse is scroll-linked (follows the finger) and is not disabled. |
| HTML and entity normalization | Decodes named/numeric entities, removes markup, flattens paragraph and line-break boundaries, and cleans SQL-escaped apostrophes in titles and summaries.                                           | Prevents upstream text encoding and HTML from producing unreadable native text.            | Summaries become plain text; inline links and rich formatting are not preserved.                                                                                                                                      |
| Event metadata                | Normalizes event start/end dates and location, shows event date metadata in the feed, and shows When/Where on details. Same-day ranges share the date.                                              | Makes event activities useful without requiring a separate event screen.                   | Missing event fields fall back to unavailable-data copy, and times use the device's local time zone.                                                                                                                  |
| Read full story               | Opens the activity's original URL with `expo-web-browser` from a “Read full story” button.                                                                                                          | Provides access to the source after the in-app summary.                                    | The button is omitted when the API has no usable URL; summary links are not separately tappable.                                                                                                                      |
| Cache-aware detail lookup     | Looks across cached activity lists, then refetches the default first page on a cache miss. The ID route supports deep links.                                                                        | Avoids passing a large object through route parameters while allowing a direct detail URL. | A cache miss only refetches the default first page; an ID absent from that response becomes “Activity not found”.                                                                                                     |

## Project structure

```text
src/
├── api/
│   ├── aggieFeed.ts
│   ├── types.ts
│   └── __tests__/aggieFeed.test.ts
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   └── activity/[id].tsx
├── components/
│   ├── AnimatedPressable.tsx
│   ├── AnimatedReveal.tsx
│   ├── FeedControls.tsx
│   ├── FeedFooter.tsx
│   ├── FeedHeader.tsx
│   ├── FeedItem.tsx
│   ├── FeedPinnedHeader.tsx
│   ├── LoadingSkeleton.tsx
│   ├── StatusView.tsx
│   └── __tests__/
├── domain/
│   ├── activity.ts
│   ├── date.ts
│   ├── parseActivities.ts
│   ├── text.ts
│   ├── fixtures/feed.fixture.ts
│   └── __tests__/
├── hooks/
│   ├── useActivities.ts
│   ├── useCollapsingHeader.ts
│   ├── useDebouncedValue.ts
│   └── __tests__/
├── integration/
│   └── router.test.tsx
├── lib/
│   └── queryClient.ts
├── screens/
│   ├── FeedScreen.tsx
│   ├── ActivityScreen.tsx
│   └── __tests__/
├── theme/
│   └── index.ts
└── ui/
    └── activityPresentation.ts
```

The layers are `api` (HTTP and wire types) → `domain` (normalization and pure helpers) →
`hooks` (TanStack Query, pagination, filtering, and view-state unions) →
`screens/components` (presentation) ← `app` routes (navigation, route state, and side effects).

## API notes

- The response is a top-level JSON array of Activity-Streams-style objects.
- The request contract accepts only `s`, `l`, and `q`. Other query parameters produce HTTP 400
  with an array of schema errors.
- Ordering is server-defined and the app preserves that order across pages.
- De-duplication is by ID only. It guards against page shifts and overlapping page results without
  merging records that only look similar.
- The same story posted by two sources can have different IDs and is intentionally shown twice so
  its source attribution is preserved.
- The parser treats the payload as untrusted JSON: the top level must be an array, and non-object
  entries are skipped.

## Libraries

### Runtime

- `expo` `~57.0.25` — Expo SDK and development runtime.
- `react` `19.2.3`, `react-native` `0.86.3` — application and native UI runtime.
- `expo-router` `~57.0.23` — file-based stack navigation and typed routes.
- `@tanstack/react-query` `^5.103.2` — feed/detail queries, cache, pagination, and refetching.
- `react-native-reanimated` `4.5.1`, `react-native-worklets` `0.10.1` — UI-thread animation and the Jest resolver.
- `@expo-google-fonts/inter` `^0.4.2`, `@expo-google-fonts/newsreader` `^0.4.1` — bundled Inter and Newsreader font faces.
- `@expo/vector-icons` `^15.0.2` — the header search icon.
- `expo-font` `~57.0.4` — startup font loading.
- `react-native-safe-area-context` `~5.7.0` — safe-area provider, insets, and detail layout.
- `react-native-screens` `~4.26.0` — native screen support used by the Expo Router stack.
- `expo-web-browser` `~57.0.3` — in-app browser for the original story URL.
- `expo-status-bar` `~57.0.1` — status-bar style tied to the device color scheme.
- `expo-system-ui` `~57.0.4` — declared Expo system UI support for the Android dark-mode background; `app.json` sets `userInterfaceStyle` to `automatic`.
- `expo-constants` `~57.0.19`, `expo-linking` `~57.0.11` — Expo Router and linking integration dependencies.
- `react-dom` `19.2.3`, `react-native-web` `^0.21.2` — web bundling/runtime support included by the Expo setup.

### Development tooling

- `typescript` `~6.0.3` — strict type checking.
- `jest` `~29.7.0`, `jest-expo` `~57.0.5` — the test runner and Expo preset.
- `@testing-library/react-native` `^14.0.1` — hook, component, screen, and router assertions.
- `@types/jest` `29.5.14`, `@types/react` `~19.2.2` — TypeScript declarations.
- `eslint` `^9.0.0`, `eslint-config-expo` `~57.0.2` — lint rules for the Expo project.
- `eslint-config-prettier` `^10.1.8`, `eslint-plugin-prettier` `^5.5.6`, `prettier` `^3.9.9` — formatting integration and checks.
- `knip` `^6.38.0` — unused code and dependency checks.
- `test-renderer` `1.2` — React test-renderer support.

## Assumptions and tradeoffs

- The public endpoint is treated as untrusted input. Missing or malformed fields remain safe
  fallbacks instead of preventing the rest of the feed from rendering.
- The API's server ordering is the display order. The client does not sort by `published`.
- Duplicate records are retained when their IDs differ, even when their titles or URLs match.
- Published and event times are formatted in the device's local time zone.
- News and Events are presentation filters because the API does not provide a type filter.
- Detail routes pass only an ID. Cached lists are reused first; a cache miss fetches the default
  first page rather than adding a separate detail endpoint.
- Feed lists are considered fresh for five minutes (TanStack Query default in
  `src/lib/queryClient.ts`); a detail lookup is considered fresh for 30 seconds.

## Testing

The Jest suite covers:

- Unit behavior for API requests, response parsing, HTML/entity cleanup, activity filtering, and
  date/presentation formatting.
- Hook behavior for loading, errors, empty states, refresh, search placeholder results, pagination,
  sparse-filter auto-fill, de-duplication, and cache-aware detail lookup.
- Component and screen rendering for feed items, header/search controls, feed states, and details.
- Expo Router integration for the real list → detail → back flow in `src/integration/router.test.tsx`.

The app and test flow were exercised on an Android emulator. No physical iOS device test was run.

## Known issues and limitations

- The React Query cache is in memory only; there is no offline persistence.
- HTML summaries are flattened to text, so links and rich formatting inside summaries are not
  interactive.
- The same story can appear more than once when different source records have different IDs.
- News and Events filtering is client-side and sparse results stop after four auto-fill pages.
- No physical iOS device test has been performed; iOS simulator support is configured but not
  hardware-validated.
- On first launch, Expo Go can remain on its loading screen or show “Something went wrong” when
  the Metro address is not reachable from the emulator or device. The troubleshooting commands
  below address the common Android emulator case.

## Troubleshooting

If an Android emulator remains on the Expo Go loading screen or shows `Something went wrong`, a
VPN or multiple network interfaces may be causing the packager address to be unreachable. Reverse
the Metro port and set the address Metro advertises to Expo Go. `REACT_NATIVE_PACKAGER_HOSTNAME`
changes the advertised address; Metro still listens on all interfaces.

Bash:

```sh
adb reverse tcp:8081 tcp:8081
REACT_NATIVE_PACKAGER_HOSTNAME=127.0.0.1 bun run start
```

Then open `exp://127.0.0.1:8081` in Expo Go.

PowerShell:

```powershell
adb reverse tcp:8081 tcp:8081
$env:REACT_NATIVE_PACKAGER_HOSTNAME = "127.0.0.1"
bun run start
```

`--localhost` binds IPv6-only on some Windows setups and does not work with `adb reverse`.
