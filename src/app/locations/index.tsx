import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';

import { getLocationsErrorMessage, useLocations } from '@/hooks/useLocations';
import { LocationsScreen, type LocationsDirectoryState } from '@/screens/LocationsScreen';

export default function LocationsRoute() {
  const params = useLocalSearchParams<{ selected?: string | string[] }>();
  const router = useRouter();
  const query = useLocations();
  const { refetch } = query;
  let state: LocationsDirectoryState;

  if (query.isPending) {
    state = { status: 'loading' };
  } else if (query.isError) {
    state = { status: 'error', message: getLocationsErrorMessage(query.error) };
  } else {
    state = {
      status: 'ready',
      categories: query.data?.categories ?? [],
      locations: query.data?.places ?? [],
    };
  }

  const onRetry = useCallback(() => {
    void refetch();
  }, [refetch]);
  const onBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  }, [router]);

  const selected = Array.isArray(params.selected) ? params.selected[0] : params.selected;

  return (
    <LocationsScreen initialSelectedId={selected} onBack={onBack} onRetry={onRetry} state={state} />
  );
}
