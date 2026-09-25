import type { Activity } from '@/domain/activity';
import { parseActivities } from '@/domain/parseActivities';

const FEED_URL = 'https://aggiefeed.ucdavis.edu/api/v1/activity/public?s=0&l=25';

export class FeedRequestError extends Error {
  constructor(readonly status: number) {
    super(`AggieFeed request failed with status ${status}.`);
    this.name = 'FeedRequestError';
  }
}

export async function fetchActivities(signal?: AbortSignal): Promise<Activity[]> {
  const response = await fetch(FEED_URL, {
    signal,
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) throw new FeedRequestError(response.status);

  const payload: unknown = await response.json();
  return parseActivities(payload);
}
