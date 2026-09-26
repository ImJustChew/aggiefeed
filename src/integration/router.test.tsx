import { ExpoRoot, router } from 'expo-router';
import { getMockContext } from 'expo-router/testing-library';
import { act, cleanup, render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { FeedRequestError, fetchActivities } from '@/api/aggieFeed';
import type { Activity } from '@/domain/activity';
import type { QueryClient } from '@tanstack/react-query';

let mockAppQueryClient: QueryClient | undefined;

jest.mock('@/api/aggieFeed', () => {
  const actual = jest.requireActual<typeof import('@/api/aggieFeed')>('@/api/aggieFeed');

  return {
    ...actual,
    fetchActivities: jest.fn(),
  };
});

jest.mock('@/lib/queryClient', () => {
  const actual = jest.requireActual<typeof import('@/lib/queryClient')>('@/lib/queryClient');

  return {
    ...actual,
    createQueryClient: () =>
      (mockAppQueryClient = actual.createQueryClient({
        defaultOptions: { queries: { gcTime: 0, retry: false } },
      })),
  };
});

const mockedFetchActivities = jest.mocked(fetchActivities);

const routeActivity: Activity = {
  id: 'route-story',
  title: 'Route story',
  source: 'Route source',
  objectType: 'notification',
  published: new Date('2026-09-25T12:00:00Z'),
  summary: 'A route test story.',
  summarySegments: [{ kind: 'text', text: 'A route test story.' }],
  url: null,
  event: null,
};

const eventActivity: Activity = {
  id: 'route-event',
  title: 'Route event',
  source: 'Events office',
  objectType: 'event',
  published: new Date('2026-09-25T12:00:00Z'),
  summary: 'A route test event.',
  summarySegments: [{ kind: 'text', text: 'A route test event.' }],
  url: null,
  event: {
    start: new Date('2026-09-26T12:00:00Z'),
    end: new Date('2026-09-26T13:00:00Z'),
    location: 'Student Community Center',
    isAllDay: false,
  },
};

async function renderRoutes(location = '/') {
  return render(<ExpoRoot context={getMockContext('./src/app')} location={location} />);
}

describe('Expo Router activity flows', () => {
  beforeEach(() => {
    jest.useRealTimers();
    jest.unmock('react-native-reanimated');
  });

  afterEach(async () => {
    await cleanup();
    mockAppQueryClient?.clear();
    jest.useRealTimers();
    mockedFetchActivities.mockReset();
  });

  it('navigates from the list to a four-field detail view and back', async () => {
    mockedFetchActivities.mockResolvedValue([routeActivity]);

    await renderRoutes();
    await screen.findByRole('button', { name: 'Route story. Route source' });

    const user = userEvent.setup();
    await user.press(screen.getByRole('button', { name: 'Route story. Route source' }));

    expect(await screen.findByText('Route story')).toBeOnTheScreen();
    expect(screen.getByText('By Route source')).toBeOnTheScreen();
    expect(screen.getByText('Notification')).toBeOnTheScreen();
    expect(screen.getAllByText('Fri, Sep 25, 2026 · 12:00 PM')[0]).toBeOnTheScreen();

    await act(() => router.back());
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Route story. Route source' })).toBeOnTheScreen(),
    );
  });

  it('shows a Retry button after an initial API error and then shows the list', async () => {
    mockedFetchActivities
      .mockRejectedValueOnce(new FeedRequestError(503))
      .mockResolvedValueOnce([routeActivity]);

    await renderRoutes();
    expect(await screen.findByText("We couldn't load the feed (HTTP 503).")).toBeOnTheScreen();

    const user = userEvent.setup();
    await user.press(screen.getByRole('button', { name: 'Retry' }));

    expect(
      await screen.findByRole('button', { name: 'Route story. Route source' }),
    ).toBeOnTheScreen();
  });

  it('shows the empty-feed message when the API returns no activities', async () => {
    mockedFetchActivities.mockResolvedValue([]);

    await renderRoutes();

    expect(await screen.findByText('No stories yet')).toBeOnTheScreen();
  });

  it('searches after debounce and offers Clear search when there are no results', async () => {
    mockedFetchActivities.mockImplementation(({ query = '' } = {}) =>
      Promise.resolve(query === 'tennis' ? [] : [routeActivity]),
    );

    await renderRoutes();
    await screen.findByRole('button', { name: 'Route story. Route source' });

    const user = userEvent.setup();
    await user.press(screen.getByRole('button', { name: 'Search stories' }));
    await user.type(screen.getByPlaceholderText('Search campus stories'), 'tennis');

    await waitFor(() =>
      expect(mockedFetchActivities).toHaveBeenCalledWith(
        expect.objectContaining({ query: 'tennis', skip: 0, limit: 25 }),
      ),
    );
    expect(await screen.findByText('No results for "tennis"')).toBeOnTheScreen();
    expect(screen.getAllByRole('button', { name: 'Clear search' })[0]).toBeOnTheScreen();
  });

  it('shows only events after the Events tab is selected', async () => {
    mockedFetchActivities.mockResolvedValue([routeActivity, eventActivity]);

    await renderRoutes();
    await screen.findByRole('button', { name: 'Route story. Route source' });

    const user = userEvent.setup();
    await user.press(screen.getByRole('tab', { name: 'Events' }));

    expect(await screen.findByText('Route event')).toBeOnTheScreen();
    expect(screen.queryByText('Route story')).not.toBeOnTheScreen();
  });

  it('shows not-found for a detail route with an unknown id', async () => {
    mockedFetchActivities.mockResolvedValue([routeActivity]);

    await renderRoutes('/activity/unknown');

    expect(await screen.findByText('Activity not found')).toBeOnTheScreen();
  });
});
