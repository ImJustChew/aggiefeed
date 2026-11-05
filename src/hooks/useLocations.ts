import { useQuery } from '@tanstack/react-query';

import { fetchLocations, LocationsRequestError } from '@/api/locations';
import { InvalidLocationsError } from '@/domain/parseLocations';

const LOCATIONS_QUERY_KEY = ['locations'] as const;
const LOCATIONS_STALE_TIME = 24 * 60 * 60 * 1000;

export function useLocations() {
  return useQuery({
    queryKey: LOCATIONS_QUERY_KEY,
    queryFn: ({ signal }) => fetchLocations({ signal }),
    staleTime: LOCATIONS_STALE_TIME,
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
