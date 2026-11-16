import { LOCATIONS_CACHE_KEY, LOCATIONS_CACHE_TTL_MS } from '@/constants/db';
import { getCachedOrFetch } from '@/db/apiCache';
import type { LocationDirectory } from '@/domain/location';
import { parseLocations } from '@/domain/parseLocations';

const LOCATIONS_URL = 'https://mobile.ucdavis.edu/api/v3/locations';

export interface FetchLocationsOptions {
  signal?: AbortSignal;
}

export class LocationsRequestError extends Error {
  constructor(readonly status: number) {
    super(`UC Davis locations request failed with status ${status}.`);
    this.name = 'LocationsRequestError';
  }
}

export async function fetchLocations({
  signal,
}: FetchLocationsOptions = {}): Promise<LocationDirectory> {
  return getCachedOrFetch({
    key: LOCATIONS_CACHE_KEY,
    policy: 'cache-first',
    ttlMs: LOCATIONS_CACHE_TTL_MS,
    signal,
    parse: parseLocations,
    fetcher: async () => {
      const response = await fetch(LOCATIONS_URL, {
        signal,
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) throw new LocationsRequestError(response.status);

      return (await response.json()) as unknown;
    },
  });
}
