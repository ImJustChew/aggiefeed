import { queryOptions, useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { FeedRequestError, fetchActivities } from '@/api/aggieFeed';
import type { Activity } from '@/domain/activity';
import { InvalidFeedError } from '@/domain/parseActivities';

const activitiesQuery = queryOptions({
  queryKey: ['activities'],
  queryFn: ({ signal }) => fetchActivities(signal),
});

export type FeedState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty' }
  | { status: 'ready'; activities: Activity[]; fetchedAt: Date };

export type ActivityState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'not-found' }
  | { status: 'ready'; activity: Activity };

function toErrorMessage(error: unknown): string {
  if (error instanceof FeedRequestError) {
    return `We couldn't load the feed (HTTP ${error.status}).`;
  }

  if (error instanceof InvalidFeedError) {
    return 'The feed returned invalid data.';
  }

  return "We couldn't load the feed. Check your connection and try again.";
}

export function useFeed() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data, error, isPending, isFetching, dataUpdatedAt, refetch } = useQuery(activitiesQuery);

  let state: FeedState;
  if (data !== undefined) {
    state =
      data.length > 0
        ? { status: 'ready', activities: data, fetchedAt: new Date(dataUpdatedAt) }
        : { status: 'empty' };
  } else if (isPending || isFetching) {
    state = { status: 'loading' };
  } else {
    state = { status: 'error', message: toErrorMessage(error) };
  }

  const reload = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  return { state, isRefreshing, reload };
}

/** Reads one activity from the shared feed cache, fetching the feed if the cache is cold. */
export function useActivity(id: string) {
  const select = useCallback(
    (activities: Activity[]) => activities.find((activity) => activity.id === id) ?? null,
    [id],
  );
  const { data, error, isPending, isFetching, refetch } = useQuery({ ...activitiesQuery, select });

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
