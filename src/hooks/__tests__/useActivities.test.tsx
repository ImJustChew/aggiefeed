import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';
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

function activity(id: string, objectType = 'notification'): Activity {
  return {
    id,
    title: `Activity ${id}`,
    source: 'UC Davis',
    objectType,
    published: new Date('2026-09-25T12:00:00Z'),
    summary: null,
    summarySegments: null,
    url: null,
    event: null,
  };
}

function page(start: number, count = 25): Activity[] {
  return Array.from({ length: count }, (_, index) => activity(`activity-${start + index}`));
}

function wrapper(queryClient: QueryClient) {
  return function QueryClientWrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function setActivities(queryClient: QueryClient, query: string, pages: Activity[][]): void {
  queryClient.setQueryData(['activities', { query }], {
    pages,
    pageParams: pages.map((_page, index) => index * 25),
  });
}

describe('activity hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createQueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
  });

  afterEach(() => {
    cleanup();
    queryClient.clear();
    mockedFetchActivities.mockReset();
  });

  it('trims the query key and transitions from loading to ready', async () => {
    let resolveFeed: (activities: Activity[]) => void = () => undefined;
    const feedPromise = new Promise<Activity[]>((resolve) => {
      resolveFeed = resolve;
    });
    mockedFetchActivities.mockReturnValue(feedPromise);

    const { result } = await renderHook(() => useFeed({ query: ' tennis ', filter: 'all' }), {
      wrapper: wrapper(queryClient),
    });

    expect(result.current.state).toEqual({ status: 'loading' });

    await act(async () => {
      resolveFeed([activity('one')]);
      await feedPromise;
    });
    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    expect(result.current.state).toEqual({
      status: 'ready',
      activities: [activity('one')],
      fetchedAt: expect.any(Date),
    });
    expect(mockedFetchActivities).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, limit: 25, query: 'tennis' }),
    );
  });

  it('keeps the previous results visible while a new search is loading', async () => {
    const previousActivity = activity('previous');
    mockedFetchActivities.mockResolvedValueOnce([previousActivity]);

    const { result, rerender } = await renderHook(
      ({ query }: { query: string }) => useFeed({ query }),
      { initialProps: { query: '' }, wrapper: wrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    await waitFor(() => expect(result.current.isSearching).toBe(false));

    let resolveSearch: (activities: Activity[]) => void = () => undefined;
    const searchPromise = new Promise<Activity[]>((resolve) => {
      resolveSearch = resolve;
    });
    mockedFetchActivities.mockReturnValueOnce(searchPromise);

    await rerender({ query: 'new search' });

    expect(result.current.state).toEqual({
      status: 'ready',
      activities: [previousActivity],
      fetchedAt: expect.any(Date),
    });
    expect(result.current.isSearching).toBe(true);
    expect(mockedFetchActivities).toHaveBeenLastCalledWith(
      expect.objectContaining({ query: 'new search', skip: 0, limit: 25 }),
    );

    await act(async () => {
      resolveSearch([activity('new-result')]);
      await searchPromise;
    });
    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    await waitFor(() => expect(result.current.isSearching).toBe(false));
  });

  it('distinguishes an empty feed from no results for a filter or search', async () => {
    mockedFetchActivities.mockResolvedValueOnce([]);
    const emptyFeed = await renderHook(() => useFeed(), { wrapper: wrapper(queryClient) });

    await waitFor(() =>
      expect(emptyFeed.result.current.state).toEqual({
        status: 'empty',
        query: '',
        filter: 'all',
        reason: 'feed-empty',
      }),
    );

    mockedFetchActivities.mockResolvedValueOnce([activity('news')]);
    const filteredFeed = await renderHook(() => useFeed({ query: 'tennis', filter: 'events' }), {
      wrapper: wrapper(queryClient),
    });

    await waitFor(() =>
      expect(filteredFeed.result.current.state).toEqual({
        status: 'empty',
        query: 'tennis',
        filter: 'events',
        reason: 'no-results',
      }),
    );
  });

  it('filters events client-side without changing the query key', async () => {
    mockedFetchActivities.mockResolvedValue([activity('news'), activity('event', 'event')]);

    const { result } = await renderHook(() => useFeed({ filter: 'events' }), {
      wrapper: wrapper(queryClient),
    });

    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    if (result.current.state.status === 'ready') {
      expect(result.current.state.activities.map(({ id }) => id)).toEqual(['event']);
    }
  });

  it.each([
    {
      label: 'an HTTP 503',
      error: new FeedRequestError(503),
      message: "We couldn't load the feed (HTTP 503).",
    },
    {
      label: 'an invalid payload',
      error: new InvalidFeedError(),
      message: 'The feed returned invalid data.',
    },
    {
      label: 'a network failure',
      error: new TypeError('Failed to fetch'),
      message: "We couldn't load the feed. Check your connection and try again.",
    },
  ])('maps $label to a user-facing error', async ({ error, message }) => {
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

  it('loads later pages and de-duplicates repeated activity ids', async () => {
    const shared = activity('shared');
    const firstPage = [...page(0, 24), shared];
    const secondPage = [shared, ...page(25, 24)];
    mockedFetchActivities.mockResolvedValueOnce(firstPage).mockResolvedValueOnce(secondPage);

    const { result } = await renderHook(() => useFeed(), {
      wrapper: wrapper(queryClient),
    });

    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    expect(result.current.hasMore).toBe(true);

    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.hasMore).toBe(true);
      if (result.current.state.status === 'ready') {
        expect(result.current.state.activities).toHaveLength(49);
        expect(result.current.state.activities.filter(({ id }) => id === 'shared')).toHaveLength(1);
      }
    });
    expect(mockedFetchActivities).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ skip: 25, limit: 25 }),
    );
  });

  it('reuses an in-flight next-page request when loadMore is called twice', async () => {
    let resolveNextPage: (activities: Activity[]) => void = () => undefined;
    const nextPagePromise = new Promise<Activity[]>((resolve) => {
      resolveNextPage = resolve;
    });
    mockedFetchActivities.mockResolvedValueOnce(page(0)).mockReturnValueOnce(nextPagePromise);

    const { result } = await renderHook(() => useFeed(), {
      wrapper: wrapper(queryClient),
    });
    await waitFor(() => expect(result.current.state.status).toBe('ready'));

    let loadMorePromises: [Promise<void>, Promise<void>] | undefined;
    await act(async () => {
      loadMorePromises = [result.current.loadMore(), result.current.loadMore()];
      await Promise.resolve();
    });

    expect(mockedFetchActivities).toHaveBeenCalledTimes(2);
    expect(mockedFetchActivities).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ skip: 25, limit: 25 }),
    );

    await act(async () => {
      resolveNextPage(page(25));
      await Promise.all(loadMorePromises ?? []);
    });
  });

  it('stops requesting after the API returns a short page', async () => {
    mockedFetchActivities.mockResolvedValueOnce(page(0)).mockResolvedValueOnce([activity('tail')]);

    const { result } = await renderHook(() => useFeed(), {
      wrapper: wrapper(queryClient),
    });
    await waitFor(() => expect(result.current.state.status).toBe('ready'));

    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => expect(result.current.hasMore).toBe(false));
    expect(mockedFetchActivities).toHaveBeenCalledTimes(2);
    await act(async () => {
      await result.current.loadMore();
    });
    expect(mockedFetchActivities).toHaveBeenCalledTimes(2);
  });

  it('stops requesting after the maximum API skip', async () => {
    mockedFetchActivities.mockImplementation(({ skip = 0 } = {}) => Promise.resolve(page(skip)));

    const { result } = await renderHook(() => useFeed(), {
      wrapper: wrapper(queryClient),
    });
    await waitFor(() => expect(result.current.state.status).toBe('ready'));

    for (let skip = 25; skip <= 4000; skip += 25) {
      await act(async () => {
        await result.current.loadMore();
      });
    }

    expect(mockedFetchActivities).toHaveBeenLastCalledWith(
      expect.objectContaining({ skip: 4000, limit: 25 }),
    );
    await waitFor(() => expect(result.current.hasMore).toBe(false));
    await act(async () => {
      await result.current.loadMore();
    });
    expect(mockedFetchActivities).toHaveBeenCalledTimes(161);
  });

  it('keeps ready items and exposes a retryable next-page error', async () => {
    const firstPage = page(0);
    mockedFetchActivities.mockResolvedValueOnce(firstPage);

    const { result } = await renderHook(() => useFeed(), {
      wrapper: wrapper(queryClient),
    });
    await waitFor(() => expect(result.current.state.status).toBe('ready'));

    let rejectNextPage: (error: unknown) => void = () => undefined;
    const nextPagePromise = new Promise<Activity[]>((_resolve, reject) => {
      rejectNextPage = reject;
    });
    mockedFetchActivities.mockReturnValueOnce(nextPagePromise);

    let loadMore: Promise<void> | undefined;
    await act(async () => {
      loadMore = result.current.loadMore();
      await Promise.resolve();
    });
    await waitFor(() => expect(result.current.isLoadingMore).toBe(true));

    await act(async () => {
      rejectNextPage(new FeedRequestError(502));
      await loadMore;
    });

    await waitFor(() => {
      expect(result.current.loadMoreError).toBe("We couldn't load the feed (HTTP 502).");
      expect(result.current.state.status).toBe('ready');
    });

    mockedFetchActivities.mockResolvedValueOnce([activity('after-retry')]);
    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.loadMoreError).toBeNull();
      if (result.current.state.status === 'ready') {
        expect(result.current.state.activities).toHaveLength(26);
      }
    });
  });

  it('auto-fills sparse filters with a bounded number of page requests', async () => {
    const firstPage = [activity('event', 'event'), ...page(0, 24)];
    const pendingPages = new Map<number, (activities: Activity[]) => void>();
    mockedFetchActivities.mockImplementation(({ skip = 0 } = {}) => {
      return new Promise<Activity[]>((resolve) => {
        pendingPages.set(skip, resolve);
      });
    });

    const { result } = await renderHook(() => useFeed({ filter: 'events' }), {
      wrapper: wrapper(queryClient),
    });

    const resolvePage = async (skip: number, activities: Activity[]) => {
      await waitFor(() => expect(pendingPages.has(skip)).toBe(true));
      await act(async () => {
        pendingPages.get(skip)?.(activities);
        await Promise.resolve();
      });
    };

    await waitFor(() => expect(mockedFetchActivities).toHaveBeenCalledTimes(1));
    await resolvePage(0, firstPage);
    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    await resolvePage(25, page(25));
    await resolvePage(50, page(50));
    await resolvePage(75, page(75));
    await resolvePage(100, page(100));
    await waitFor(() => expect(mockedFetchActivities).toHaveBeenCalledTimes(5));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mockedFetchActivities.mock.calls.map(([request]) => request?.skip)).toEqual([
      0, 25, 50, 75, 100,
    ]);
    expect(mockedFetchActivities.mock.calls.map(([request]) => request?.skip)).not.toContain(125);
    expect(result.current.hasMore).toBe(true);
  });

  it('trims loaded pages before a pull-to-refresh refetch', async () => {
    const firstPage = page(0);
    const secondPage = page(25);
    mockedFetchActivities.mockResolvedValueOnce(firstPage).mockResolvedValueOnce(secondPage);

    const { result } = await renderHook(() => useFeed(), {
      wrapper: wrapper(queryClient),
    });
    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    await act(async () => {
      await result.current.loadMore();
    });
    await waitFor(() => {
      expect(result.current.state.status).toBe('ready');
      if (result.current.state.status === 'ready') {
        expect(result.current.state.activities).toHaveLength(50);
      }
    });

    let resolveRefresh: (activities: Activity[]) => void = () => undefined;
    const refreshPromise = new Promise<Activity[]>((resolve) => {
      resolveRefresh = resolve;
    });
    mockedFetchActivities.mockReturnValueOnce(refreshPromise);

    let reload: Promise<void> | undefined;
    await act(async () => {
      reload = result.current.reload();
      await Promise.resolve();
    });

    expect(result.current.isRefreshing).toBe(true);
    expect(result.current.state.status).toBe('ready');
    if (result.current.state.status === 'ready') {
      expect(result.current.state.activities).toEqual(firstPage);
    }
    expect(mockedFetchActivities.mock.calls.map(([request]) => request?.skip)).toEqual([0, 25, 0]);

    await act(async () => {
      resolveRefresh([activity('refreshed')]);
      await reload;
    });
  });

  it.each([
    { label: 'the default feed', query: '', id: 'default-result' },
    { label: 'a search for "tennis"', query: 'tennis', id: 'search-result' },
  ])('shows a detail from $label', async ({ query, id }) => {
    queryClient.setQueryDefaults(['activities'], { gcTime: Infinity });
    const cachedActivity = activity(id);
    setActivities(queryClient, query, [[cachedActivity]]);

    const { result } = await renderHook(() => useActivity(id), {
      wrapper: wrapper(queryClient),
    });

    expect(result.current.state).toEqual({ status: 'ready', activity: cachedActivity });
    expect(mockedFetchActivities).not.toHaveBeenCalled();
  });

  it('fetches the default page when cached queries do not contain the requested id', async () => {
    const cachedActivity = activity('cached-result');
    const fetchedActivity = activity('fetched-result');
    setActivities(queryClient, '', [[cachedActivity]]);
    mockedFetchActivities.mockResolvedValueOnce([fetchedActivity]);

    const { result } = await renderHook(() => useActivity('fetched-result'), {
      wrapper: wrapper(queryClient),
    });

    await waitFor(() =>
      expect(result.current.state).toEqual({ status: 'ready', activity: fetchedActivity }),
    );
    expect(mockedFetchActivities).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, limit: 25, query: '' }),
    );
  });

  it('fetches the default first page on a cold detail cache and reports unknown ids', async () => {
    let resolveFeed: (activities: Activity[]) => void = () => undefined;
    const feedPromise = new Promise<Activity[]>((resolve) => {
      resolveFeed = resolve;
    });
    mockedFetchActivities.mockReturnValue(feedPromise);

    const { result } = await renderHook(() => useActivity('missing'), {
      wrapper: wrapper(queryClient),
    });

    expect(result.current.state).toEqual({ status: 'loading' });
    await act(async () => {
      resolveFeed([activity('known')]);
      await feedPromise;
    });
    await waitFor(() => expect(result.current.state).toEqual({ status: 'not-found' }));
    expect(mockedFetchActivities).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, limit: 25, query: '' }),
    );
  });

  it('shows the detail error and loading state while retrying', async () => {
    mockedFetchActivities.mockRejectedValueOnce(new FeedRequestError(503));

    const { result } = await renderHook(() => useActivity('missing'), {
      wrapper: wrapper(queryClient),
    });

    await waitFor(() =>
      expect(result.current.state).toEqual({
        status: 'error',
        message: "We couldn't load the feed (HTTP 503).",
      }),
    );

    let resolveRetry: (activities: Activity[]) => void = () => undefined;
    const retryPromise = new Promise<Activity[]>((resolve) => {
      resolveRetry = resolve;
    });
    mockedFetchActivities.mockReturnValueOnce(retryPromise);

    let reload: ReturnType<typeof result.current.reload> | undefined;
    await act(async () => {
      reload = result.current.reload();
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.state).toEqual({ status: 'loading' }));

    await act(async () => {
      resolveRetry([activity('missing')]);
      await reload;
    });

    await waitFor(() =>
      expect(result.current.state).toEqual({
        status: 'ready',
        activity: activity('missing'),
      }),
    );
  });
});
