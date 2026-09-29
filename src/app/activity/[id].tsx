import { useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

import { ActivityScreen } from '@/screens/ActivityScreen';
import { useActivity } from '@/hooks/useActivities';

export default function ActivityRoute() {
  const params = useLocalSearchParams<{ id: string }>();
  const state = useActivity(params.id);
  const openUrl = useCallback((url: string): void => {
    void WebBrowser.openBrowserAsync(url).catch(() => undefined);
  }, []);

  return <ActivityScreen state={state} onOpenUrl={openUrl} />;
}
