import { router } from 'expo-router';

import { FeedScreen } from '@/screens/FeedScreen';
import { useFeed } from '@/hooks/useActivities';

export default function FeedRoute() {
  const { state, isRefreshing, reload } = useFeed();

  return (
    <FeedScreen
      state={state}
      isRefreshing={isRefreshing}
      onRefresh={reload}
      onPressActivity={(id) => router.push({ pathname: '/activity/[id]', params: { id } })}
    />
  );
}
