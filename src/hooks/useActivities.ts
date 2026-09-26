import {
  infiniteQueryOptions,
  keepPreviousData,
  queryOptions,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
const ACTIVITY_STALE_TIME = 30_000;

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

function activitiesQueryOptions(query: string, enabled = true) {
  return infiniteQueryOptions({
    queryKey: activitiesQueryKey(query),
    enabled,
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
  const queryKey = useMemo(() => activitiesQueryKey(normalizedQuery), [normalizedQuery]);
  const queryOptions = useMemo(() => activitiesQueryOptions(normalizedQuery), [normalizedQuery]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const autoFill = useRef({ key: '', count: 0 });
  const {
    data,
    error,
    isPending,
    isFetching,
    isFetchingNextPage,
    isFetchNextPageError,
    hasNextPage,
    fetchNextPage,
    dataUpdatedAt,
    refetch,
  } = useInfiniteQuery(queryOptions);

  const allActivities = useMemo(() => flattenActivities(data?.pages ?? []), [data]);
  const activities = useMemo(
    () => filterActivities(allActivities, filter),
    [allActivities, filter],
  );
  const hasMore = hasNextPage === true;
  const loadMoreError = isFetchNextPageError ? toErrorMessage(error) : null;

  const loadMore = useCallback(async () => {
    if (!hasMore || isFetchingNextPage) return;

    await fetchNextPage();
  }, [fetchNextPage, hasMore, isFetchingNextPage]);

  useEffect(() => {
    const key = `${normalizedQuery}\u0000${filter}`;
    if (autoFill.current.key !== key) {
      autoFill.current = { key, count: 0 };
    }

    if (
      activities.length >= SPARSE_FILTER_THRESHOLD ||
      !hasMore ||
      isPending ||
      isFetching ||
      isFetchingNextPage ||
      autoFill.current.count >= AUTO_FILL_LIMIT
    ) {
      return;
    }

    autoFill.current.count += 1;
    void loadMore();
  }, [
    activities.length,
    dataUpdatedAt,
    filter,
    hasMore,
    isFetching,
    isFetchingNextPage,
    isPending,
    loadMore,
    normalizedQuery,
  ]);

  const reload = useCallback(async () => {
    setIsRefreshing(true);
    try {
      queryClient.setQueryData<ActivitiesQueryData>(queryKey, (current) => {
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
  }, [queryClient, queryKey, refetch]);

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
    isRefreshing,
    reload,
  };
}

/** Reads one activity from cached feed queries, fetching the default page if needed. */
export function useActivity(id: string) {
  const queryClient = useQueryClient();
  const activityQueryOptions = useMemo(
    () =>
      queryOptions({
        queryKey: ['activity', id] as const,
        queryFn: async ({ signal }) => {
          const activities = await fetchActivities({
            skip: 0,
            limit: ACTIVITY_PAGE_SIZE,
            query: '',
            signal,
          });
          return activities.find((activity) => activity.id === id) ?? null;
        },
        initialData: () => {
          const cachedQueries = queryClient.getQueriesData<ActivitiesQueryData>({
            queryKey: ['activities'],
          });
          const hasCachedData = cachedQueries.some(([, cached]) => cached !== undefined);
          if (!hasCachedData) return undefined;

          return (
            flattenActivities(cachedQueries.flatMap(([, cached]) => cached?.pages ?? [])).find(
              (activity) => activity.id === id,
            ) ?? null
          );
        },
        staleTime: ACTIVITY_STALE_TIME,
      }),
    [id, queryClient],
  );
  const { data, error, isPending, isFetching, refetch } = useQuery(activityQueryOptions);

  let state: ActivityState;
  if (data !== undefined && data !== null) {
    state = { status: 'ready', activity: data };
  } else if (data === null) {
    state = { status: 'not-found' };
  } else if (isPending || isFetching) {
    state = { status: 'loading' };
  } else {
    state = { status: 'error', message: toErrorMessage(error) };
  }

  const reload = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return { state, reload };
}
