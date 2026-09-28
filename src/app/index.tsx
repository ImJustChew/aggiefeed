import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
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
  const search = useMemo(
    () => ({
      query,
      isOpen: isSearchOpen,
      isSearching,
      onOpen: openSearch,
      onClose: closeSearch,
      onQueryChange: setQuery,
      onClear: clearSearch,
    }),
    [clearSearch, closeSearch, isSearchOpen, isSearching, openSearch, query],
  );
  const pagination = useMemo(
    () => ({ hasMore, isLoadingMore, loadMoreError, onLoadMore: loadMore }),
    [hasMore, isLoadingMore, loadMore, loadMoreError],
  );

  return (
    <FeedScreen
      state={state}
      filter={filter}
      onFilterChange={setFilter}
      isRefreshing={isRefreshing}
      onRefresh={reload}
      onShowAll={showAll}
      onPressActivity={onPressActivity}
      search={search}
      pagination={pagination}
    />
  );
}
