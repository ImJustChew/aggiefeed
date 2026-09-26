import { useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

import { ActivityScreen } from '@/screens/ActivityScreen';
import { useActivity } from '@/hooks/useActivities';

export default function ActivityRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = params.id;
  const id = Array.isArray(rawId) ? (rawId[0] ?? '') : (rawId ?? '');
  const { state, reload } = useActivity(id);
  const openUrl = useCallback(async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      return;
    }
  }, []);

  return <ActivityScreen state={state} onRetry={reload} onOpenUrl={openUrl} />;
}
