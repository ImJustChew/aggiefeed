import { getCachedOrFetch } from '@/db/apiCache';
import type { Activity } from '@/domain/activity';
import { parseActivities } from '@/domain/parseActivities';

const FEED_URL = 'https://aggiefeed.ucdavis.edu/api/v1/activity/public';

export const ACTIVITY_PAGE_SIZE = 25;
export const MAX_ACTIVITY_SKIP = 4000;

export interface FetchActivitiesOptions {
  skip?: number;
  limit?: number;
  query?: string;
  signal?: AbortSignal;
}

export class FeedRequestError extends Error {
  constructor(readonly status: number) {
    super(`AggieFeed request failed with status ${status}.`);
    this.name = 'FeedRequestError';
  }
}

export async function fetchActivities({
  skip = 0,
  limit = ACTIVITY_PAGE_SIZE,
  query,
  signal,
}: FetchActivitiesOptions = {}): Promise<Activity[]> {
  const params = new URLSearchParams({ s: String(skip), l: String(limit) });
  const normalizedQuery = query?.trim() ?? '';
  if (normalizedQuery) params.set('q', normalizedQuery);

  return getCachedOrFetch({
    key: `activities:v1:${JSON.stringify([skip, limit, normalizedQuery])}`,
    policy: 'network-first',
    signal,
    parse: (payload) => parseActivities(payload, skip),
    fetcher: async () => {
      const response = await fetch(`${FEED_URL}?${params.toString()}`, {
        signal,
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) throw new FeedRequestError(response.status);

      return (await response.json()) as unknown;
    },
  });
}
