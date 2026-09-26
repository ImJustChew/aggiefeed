# AggieFeed

AggieFeed is an Expo and React Native app that loads public AggieFeed activities,
displays them in an editorial list, and opens a detail screen for each activity.
The feed includes campus news and events, with debounced search, type tabs,
infinite scroll, pull-to-refresh, and clear loading, empty, error, retry,
missing-field, and not-found states.

## Requirements

- Node.js 22.13+ on the supported 22 line, or Node.js 24+. React Native Testing
  Library 14 requires `^22.13 || >=24`.
- Bun.
- Expo Go for SDK 57 on a physical device, or an Android emulator / iOS simulator.
- Network access to the public AggieFeed endpoint:
  `https://aggiefeed.ucdavis.edu/api/v1/activity/public?s=0&l=25`.

## Setup

Install dependencies from the repository root:

```sh
bun install
```

## Run the app

Start the Expo development server:

```sh
bun start
```

In the Expo CLI, press `a` for Android, press `i` for iOS, or scan the QR code
with Expo Go.

The platform-specific shortcuts are also available:

```sh
bun run android
bun run ios
```

`bun run android` requires an available Android emulator or connected device.
`bun run ios` requires an available iOS simulator.

## Quality checks

Run checks individually:

```sh
bun run typecheck
bun run lint
bun run test
bun run knip
```

Run the combined check command:

```sh
bun run check
```

Format the repository with:

```sh
bun run format
```

## Libraries

- Expo SDK 57 — React Native runtime and Expo development tooling.
- Expo Router — file-based navigation for the feed and activity routes.
- TanStack Query — request state, caching, retry, placeholder results during
  search, infinite pages, and pull-to-refresh refetches.
- Reanimated 4 — press and entrance motion with reduced-motion support.
- `expo-font` + Inter — startup-loaded application typography.
- `expo-web-browser` — opens the original story or event URL.
- Jest + `jest-expo` + React Native Testing Library — API, domain, hook, screen,
  and component tests.
- ESLint + Prettier — static analysis and consistent formatting.
- knip — unused file, export, and dependency detection.

## Project structure

```text
src/
├── api/                 HTTP client and API wire types
│   └── __tests__/       API request and response tests
├── app/                 Expo Router route containers
│   └── activity/        Activity detail route
├── components/          Presentational header, search, tabs, feed, and status components
│   └── __tests__/       Component tests
├── domain/              Normalized activity model and pure parsing helpers
│   ├── __tests__/       Date, text, and normalization tests
│   └── fixtures/        Test feed data
├── hooks/               React Query hooks, view-state unions, and debouncing
│   └── __tests__/       Hook state and cache tests
├── lib/                 Shared infrastructure such as the QueryClient
├── screens/             Presentational feed and detail screens
│   └── __tests__/       Screen tests
├── theme/               Fonts, spacing, colors, and light/dark themes
└── ui/                  Activity display and fallback formatting
```

The layering is `api` (HTTP + wire types) → `domain` (normalization, pure) →
`hooks` (React Query, infinite pages, and small view-state unions) →
`screens/components` (presentational) ← app routes (search/filter state, hooks,
navigation, and side effects).

## Data notes

The endpoint returns a top-level JSON array of Activity Streams-style objects.
The array mixes `notification` items, treated as news, and `event` items. The
first request is `s=0&l=25`. Infinite scroll requests another 25 activities per
page. The server caps `s` at 4000 and `l` at 500; this app keeps its page size
at 25. Search is sent to the server as `q`. News and Events tabs are client-side
filters because the server has no type filter. Sparse filtered tabs auto-fill
from later pages, capped at four additional page requests.

- The API and domain parser treat the response as untrusted JSON. The top-level
  value must be an array; non-object entries are skipped and missing or mistyped
  fields become safe fallbacks instead of crashing the UI.
- Titles and content may contain named or numeric HTML entities. Text cleanup
  decodes those entities and fixes SQL-escaped apostrophes such as `You''ll`.
- Content summaries may contain HTML tags. Tags are flattened to plain text,
  with paragraph and line-break boundaries converted to spaces. Links inside a
  summary are therefore text, not interactive elements.
- The same story can be posted by two sources. The app keeps both API records,
  including their source attribution, because the specification says to render
  the returned activities and does not request deduplication.
- Event metadata is normalized when present. Feed items show an `Event ·
<weekday, month day>` label, and the detail screen shows when and where.

## Assumptions and tradeoffs

- Duplicate stories remain visible because the API response is rendered as
  received.
- The detail screen looks up an activity by id in the shared query cache rather
  than passing the full object through route params. This supports deep links;
  a cold cache refetches the feed before showing the detail.
- The app stops requesting pages when a short page is returned or when the
  server-side skip cap is reached. Sparse News or Events results may therefore
  contain fewer than the requested amount after the four-page auto-fill limit.
- Search uses the server's full-text `q` parameter after a short input debounce;
  type tabs filter the normalized results locally.
- Published and event times use the device's local time zone.
- `objectType` is shown with its raw value formatted as a label in Details,
  while the top of the screen uses a friendlier label such as News or Event.
- Inter is loaded at startup before the splash screen is hidden.

## Optional enhancements implemented

- Pull-to-refresh on the feed.
- Infinite scroll with loading, retry, and end-of-feed footer states.
- Debounced server search and client-side News / Events tabs.
- Retry actions for failed requests and empty feeds.
- Relative and absolute date formatting.
- Unit, hook, screen, component, and API tests.
- Accessibility roles, labels, hints, and live regions.
- Light and dark mode using the device color scheme.
- React Query caching and request cancellation.
- Press, reveal, and loading motion that respects reduced-motion settings.

## Known issues and limitations

- There is no offline persistence; the React Query cache is in memory.
- HTML content is flattened to plain text. Links inside summaries are not
  tappable; `Read full story` opens the original URL when one is available.
- Duplicate stories can appear twice when the API returns them from different
  sources.
- The API does not expose a type filter, so News and Events filtering is
  client-side and sparse tabs stop after four auto-fill pages.
- The app has not been tested on a physical iOS device. Validation was done on
  an Android emulator and with unit/component tests.

## Troubleshooting

If an Android emulator remains on the Expo Go loading screen or shows
`Something went wrong`, a VPN or multiple network interfaces may be causing the
packager address to be unreachable. Reverse the Metro port and set the address
Metro advertises to Expo Go. `REACT_NATIVE_PACKAGER_HOSTNAME` changes the
advertised address; Metro still listens on all interfaces:

```sh
adb reverse tcp:8081 tcp:8081
REACT_NATIVE_PACKAGER_HOSTNAME=127.0.0.1 bun start
```

Then open `exp://127.0.0.1:8081` in Expo Go. On PowerShell, set the environment
variable before starting instead:

```powershell
adb reverse tcp:8081 tcp:8081
$env:REACT_NATIVE_PACKAGER_HOSTNAME = "127.0.0.1"
bun start
```

`--localhost` binds IPv6-only on some Windows setups and does not work with
`adb reverse`.
