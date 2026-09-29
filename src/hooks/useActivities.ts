import {
  infiniteQueryOptions,
  keepPreviousData,
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';

import {
  ACTIVITY_PAGE_SIZE,
  FeedRequestError,
  fetchActivities,
  MAX_ACTIVITY_SKIP,
} from '@/api/aggieFeed';
import {
  filterActivities,
  flattenActivities,
  type Activity,
  type ActivityFilter,
} from '@/domain/activity';
import { InvalidFeedError } from '@/domain/parseActivities';

type ActivitiesQueryData = InfiniteData<Activity[], number>;
type ActivitiesQueryKey = readonly ['activities', { query: string }];

const AUTO_FILL_LIMIT = 4;
const SPARSE_FILTER_THRESHOLD = 10;

export type FeedState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'empty';
      query: string;
      filter: ActivityFilter;
      reason: 'feed-empty' | 'no-results';
    }
  | { status: 'ready'; activities: Activity[]; fetchedAt: Date };

export type ActivityState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'not-found' }
  | { status: 'ready'; activity: Activity };

export interface UseFeedOptions {
  query?: string;
  filter?: ActivityFilter;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof FeedRequestError) {
    return `We couldn't load the feed (HTTP ${error.status}).`;
  }

  if (error instanceof InvalidFeedError) {
    return 'The feed returned invalid data.';
  }

  return "We couldn't load the feed. Check your connection and try again.";
}

function activitiesQueryKey(query: string): ActivitiesQueryKey {
  return ['activities', { query }];
}

function findCachedActivity(queryClient: QueryClient, id: string): Activity | undefined {
  const cachedQueries = queryClient.getQueriesData<ActivitiesQueryData>({
    queryKey: ['activities'],
  });

  return flattenActivities(cachedQueries.flatMap(([, cached]) => cached?.pages ?? [])).find(
    (activity) => activity.id === id,
  );
}

function activitiesQueryOptions(query: string) {
  return infiniteQueryOptions({
    queryKey: activitiesQueryKey(query),
    queryFn: ({ pageParam, signal }) =>
      fetchActivities({
        skip: pageParam,
        limit: ACTIVITY_PAGE_SIZE,
        query,
        signal,
      }),
    initialPageParam: 0,
    placeholderData: keepPreviousData,
    getNextPageParam: (lastPage, _pages, lastPageParam) => {
      if (lastPage.length < ACTIVITY_PAGE_SIZE) return undefined;

      const nextSkip = lastPageParam + ACTIVITY_PAGE_SIZE;
      return nextSkip <= MAX_ACTIVITY_SKIP ? nextSkip : undefined;
    },
  });
}

export function useFeed({ query = '', filter = 'all' }: UseFeedOptions = {}) {
  const queryClient = useQueryClient();
  const normalizedQuery = query.trim();
  const listQuery = activitiesQueryOptions(normalizedQuery);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const autoFill = useRef({ key: '', count: 0 });
  const {
    data,
    error,
    isPending,
    isFetching,
    isPlaceholderData,
    isFetchingNextPage,
    isFetchNextPageError,
    hasNextPage,
    fetchNextPage,
    dataUpdatedAt,
    refetch,
  } = useInfiniteQuery(listQuery);

  const allActivities = useMemo(() => flattenActivities(data?.pages ?? []), [data]);
  const activities = useMemo(
    () => filterActivities(allActivities, filter),
    [allActivities, filter],
  );
  const hasMore = hasNextPage === true;
  const loadMoreError = isFetchNextPageError ? toErrorMessage(error) : null;
  const isSearching = isFetching && isPlaceholderData;

  const loadMore = useCallback(async () => {
    if (!hasMore) return;

    await fetchNextPage({ cancelRefetch: false });
  }, [fetchNextPage, hasMore]);

  useEffect(() => {
    const key = `${normalizedQuery}\u0000${filter}`;
    if (autoFill.current.key !== key) {
      autoFill.current = { key, count: 0 };
    }

    if (
      activities.length >= SPARSE_FILTER_THRESHOLD ||
      !hasMore ||
      isFetching ||
      autoFill.current.count >= AUTO_FILL_LIMIT
    ) {
      return;
    }

    autoFill.current.count += 1;
    void loadMore();
  }, [activities.length, dataUpdatedAt, filter, hasMore, isFetching, loadMore, normalizedQuery]);

  const reload = useCallback(async () => {
    setIsRefreshing(true);
    try {
      queryClient.setQueryData<ActivitiesQueryData>(listQuery.queryKey, (current) => {
        if (current === undefined || current.pages.length <= 1) return current;

        return {
          ...current,
          pages: current.pages.slice(0, 1),
          pageParams: current.pageParams.slice(0, 1),
        };
      });
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [listQuery.queryKey, queryClient, refetch]);

  let state: FeedState;
  if (data !== undefined) {
    state =
      activities.length > 0
        ? {
            status: 'ready',
            activities,
            fetchedAt: new Date(dataUpdatedAt),
          }
        : {
            status: 'empty',
            query: normalizedQuery,
            filter,
            reason:
              normalizedQuery.length > 0 || filter !== 'all' || allActivities.length > 0
                ? 'no-results'
                : 'feed-empty',
          };
  } else if (isPending || isFetching) {
    state = { status: 'loading' };
  } else {
    state = { status: 'error', message: toErrorMessage(error) };
  }

  return {
    state,
    loadMore,
    hasMore,
    isLoadingMore: isFetchingNextPage,
    loadMoreError,
    isSearching,
    isRefreshing,
    reload,
  };
}

/** Reads one activity from cached feed queries; never fetches because the API has no single-activity endpoint. */
export function useActivity(id: string): ActivityState {
  const queryClient = useQueryClient();
  const subscribe = useCallback(
    (listener: () => void) => queryClient.getQueryCache().subscribe(listener),
    [queryClient],
  );
  const getSnapshot = useCallback(() => findCachedActivity(queryClient, id), [id, queryClient]);
  const activity = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return activity === undefined ? { status: 'not-found' } : { status: 'ready', activity };
}
