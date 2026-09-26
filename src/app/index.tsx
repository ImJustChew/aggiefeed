import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { BackHandler } from 'react-native';

import type { ActivityFilter } from '@/domain/activity';
import { FeedScreen } from '@/screens/FeedScreen';
import { useFeed } from '@/hooks/useActivities';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

export default function FeedRoute() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const debouncedQuery = useDebouncedValue(query);
  const {
    state,
    loadMore,
    hasMore,
    isLoadingMore,
    loadMoreError,
    isSearching,
    isRefreshing,
    reload,
  } = useFeed({ query: debouncedQuery, filter });

  const clearSearch = useCallback(() => setQuery(''), []);
  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => {
    setQuery('');
    setIsSearchOpen(false);
  }, []);
  const showAll = useCallback(() => {
    setQuery('');
    setFilter('all');
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!isSearchOpen) return undefined;

      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        closeSearch();
        return true;
      });

      return () => subscription.remove();
    }, [closeSearch, isSearchOpen]),
  );

  const onPressActivity = useCallback((id: string) => {
    router.push({ pathname: '/activity/[id]', params: { id } });
  }, []);

  return (
    <FeedScreen
      state={state}
      isSearchOpen={isSearchOpen}
      query={query}
      filter={filter}
      onOpenSearch={openSearch}
      onCloseSearch={closeSearch}
      onQueryChange={setQuery}
      onFilterChange={setFilter}
      isRefreshing={isRefreshing}
      onRefresh={reload}
      onLoadMore={loadMore}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      loadMoreError={loadMoreError}
      isSearching={isSearching}
      onClearSearch={clearSearch}
      onShowAll={showAll}
      onPressActivity={onPressActivity}
    />
  );
}
