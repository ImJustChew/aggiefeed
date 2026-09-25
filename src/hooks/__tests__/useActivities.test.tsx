import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { FeedRequestError, fetchActivities } from '@/api/aggieFeed';
import type { Activity } from '@/domain/activity';
import { InvalidFeedError } from '@/domain/parseActivities';
import { createQueryClient } from '@/lib/queryClient';

import { useActivity, useFeed } from '../useActivities';

jest.mock('@/api/aggieFeed', () => {
  const actual = jest.requireActual<typeof import('@/api/aggieFeed')>('@/api/aggieFeed');

  return {
    ...actual,
    fetchActivities: jest.fn(),
  };
});

const mockedFetchActivities = jest.mocked(fetchActivities);

function activity(id: string): Activity {
  return {
    id,
    title: `Activity ${id}`,
    source: 'UC Davis',
    objectType: 'notification',
    published: new Date('2026-09-25T12:00:00Z'),
    summary: null,
    url: null,
    event: null,
  };
}

function wrapper(queryClient: QueryClient) {
  return function QueryClientWrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('activity hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createQueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
  });

  afterEach(() => {
    queryClient.clear();
    mockedFetchActivities.mockReset();
  });

  it('transitions from loading to ready with a fetch timestamp', async () => {
    let resolveFeed: (activities: Activity[]) => void = () => undefined;
    const feedPromise = new Promise<Activity[]>((resolve) => {
      resolveFeed = resolve;
    });
    mockedFetchActivities.mockReturnValue(feedPromise);

    const { result } = await renderHook(() => useFeed(), {
      wrapper: wrapper(queryClient),
    });

    expect(result.current.state).toEqual({ status: 'loading' });
    expect(result.current.isRefreshing).toBe(false);

    await act(() => {
      resolveFeed([activity('one')]);
    });

    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    if (result.current.state.status === 'ready') {
      expect(result.current.state.activities).toEqual([activity('one')]);
      expect(result.current.state.fetchedAt).toBeInstanceOf(Date);
    }
  });

  it('reports an empty feed', async () => {
    mockedFetchActivities.mockResolvedValue([]);

    const { result } = await renderHook(() => useFeed(), {
      wrapper: wrapper(queryClient),
    });

    await waitFor(() => expect(result.current.state).toEqual({ status: 'empty' }));
  });

  it.each([
    [new FeedRequestError(503), "We couldn't load the feed (HTTP 503)."],
    [new InvalidFeedError(), 'The feed returned invalid data.'],
    [
      new TypeError('Failed to fetch'),
      "We couldn't load the feed. Check your connection and try again.",
    ],
  ])('maps %p to a user-facing error', async (error, message) => {
    mockedFetchActivities.mockRejectedValue(error);

    const { result } = await renderHook(() => useFeed(), {
      wrapper: wrapper(queryClient),
    });

    await waitFor(() => expect(result.current.state).toEqual({ status: 'error', message }));
  });

  it('keeps cached data when a user-visible refetch fails', async () => {
    const firstActivity = activity('one');
    mockedFetchActivities.mockResolvedValueOnce([firstActivity]);

    const { result } = await renderHook(() => useFeed(), {
      wrapper: wrapper(queryClient),
    });

    await waitFor(() => expect(result.current.state.status).toBe('ready'));

    let rejectRefresh: (error: unknown) => void = () => undefined;
    const refreshPromise = new Promise<Activity[]>((_resolve, reject) => {
      rejectRefresh = reject;
    });
    mockedFetchActivities.mockReturnValueOnce(refreshPromise);

    let reload: Promise<void> | undefined;
    await act(async () => {
      reload = result.current.reload();
      await Promise.resolve();
    });
    expect(result.current.isRefreshing).toBe(true);

    await act(async () => {
      rejectRefresh(new FeedRequestError(500));
      await reload;
    });

    expect(result.current.isRefreshing).toBe(false);
    expect(result.current.state).toEqual({
      status: 'ready',
      activities: [firstActivity],
      fetchedAt: expect.any(Date),
    });
  });

  it('shows loading while retrying an initial failed fetch', async () => {
    mockedFetchActivities.mockRejectedValueOnce(new FeedRequestError(503));

    const { result } = await renderHook(() => useFeed(), {
      wrapper: wrapper(queryClient),
    });

    await waitFor(() => expect(result.current.state.status).toBe('error'));

    let resolveRetry: (activities: Activity[]) => void = () => undefined;
    const retryPromise = new Promise<Activity[]>((resolve) => {
      resolveRetry = resolve;
    });
    mockedFetchActivities.mockReturnValueOnce(retryPromise);

    let reload: Promise<void> | undefined;
    await act(async () => {
      reload = result.current.reload();
      await Promise.resolve();
    });

    expect(result.current.state).toEqual({ status: 'loading' });

    await act(async () => {
      resolveRetry([activity('retry')]);
      await reload;
    });

    await waitFor(() =>
      expect(result.current.state).toEqual({
        status: 'ready',
        activities: [activity('retry')],
        fetchedAt: expect.any(Date),
      }),
    );
  });

  it('finds an activity from the shared feed cache', async () => {
    const firstActivity = activity('one');
    const secondActivity = activity('two');
    queryClient.setQueryData(['activities'], [firstActivity, secondActivity]);

    const { result } = await renderHook(() => useActivity('two'), {
      wrapper: wrapper(queryClient),
    });

    expect(result.current.state).toEqual({ status: 'ready', activity: secondActivity });
    expect(mockedFetchActivities).not.toHaveBeenCalled();
  });

  it('reports an unknown activity id as not-found', async () => {
    mockedFetchActivities.mockResolvedValue([activity('one')]);

    const { result } = await renderHook(() => useActivity('missing'), {
      wrapper: wrapper(queryClient),
    });

    await waitFor(() => expect(result.current.state).toEqual({ status: 'not-found' }));
  });

  it('fetches the feed when a detail screen starts with a cold cache', async () => {
    const requestedActivity = activity('deep-link');
    mockedFetchActivities.mockResolvedValue([requestedActivity]);

    const { result } = await renderHook(() => useActivity('deep-link'), {
      wrapper: wrapper(queryClient),
    });

    expect(result.current.state).toEqual({ status: 'loading' });
    await waitFor(() =>
      expect(result.current.state).toEqual({ status: 'ready', activity: requestedActivity }),
    );
    expect(mockedFetchActivities).toHaveBeenCalledTimes(1);
  });
});
