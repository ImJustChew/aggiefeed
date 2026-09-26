import { router } from 'expo-router';
import { useCallback, useState } from 'react';

import type { ActivityFilter } from '@/domain/activity';
import { FeedScreen } from '@/screens/FeedScreen';
import { useFeed } from '@/hooks/useActivities';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

export default function FeedRoute() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const debouncedQuery = useDebouncedValue(query);
  const { state, loadMore, hasMore, isLoadingMore, loadMoreError, isRefreshing, reload } = useFeed({
    query: debouncedQuery,
    filter,
  });

  const clearSearch = useCallback(() => setQuery(''), []);
  const showAll = useCallback(() => {
    setQuery('');
    setFilter('all');
  }, []);

  return (
    <FeedScreen
      state={state}
      query={query}
      filter={filter}
      onQueryChange={setQuery}
      onFilterChange={setFilter}
      isRefreshing={isRefreshing}
      onRefresh={reload}
      onLoadMore={loadMore}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      loadMoreError={loadMoreError}
      onClearSearch={clearSearch}
      onShowAll={showAll}
      onPressActivity={(id) => router.push({ pathname: '/activity/[id]', params: { id } })}
    />
  );
}
