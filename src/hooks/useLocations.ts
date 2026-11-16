import { useQuery } from '@tanstack/react-query';

import { fetchLocations, LocationsRequestError } from '@/api/locations';
import { LOCATIONS_CACHE_TTL_MS } from '@/constants/db';
import { InvalidLocationsError } from '@/domain/parseLocations';

const LOCATIONS_QUERY_KEY = ['locations'] as const;

export function useLocations() {
  return useQuery({
    queryKey: LOCATIONS_QUERY_KEY,
    queryFn: ({ signal }) => fetchLocations({ signal }),
    staleTime: LOCATIONS_CACHE_TTL_MS,
  });
}

export function getLocationsErrorMessage(error: unknown): string {
  if (error instanceof LocationsRequestError) {
    return `We couldn't load campus locations (HTTP ${error.status}).`;
  }

  if (error instanceof InvalidLocationsError) {
    return 'The locations directory returned invalid data.';
  }

  return "We couldn't load campus locations. Check your connection and try again.";
}
