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
  const response = await fetch(LOCATIONS_URL, {
    signal,
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) throw new LocationsRequestError(response.status);

  const payload: unknown = await response.json();
  return parseLocations(payload);
}
