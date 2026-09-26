import { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, type ListRenderItem } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';

import type { Activity, ActivityFilter } from '@/domain/activity';
import type { FeedState } from '@/hooks/useActivities';
import { useCollapsingHeader } from '@/hooks/useCollapsingHeader';
import { spacing, useTheme } from '@/theme';

import { FeedFooter } from '@/components/FeedFooter';
import { FeedItem } from '@/components/FeedItem';
import { FeedPinnedHeader } from '@/components/FeedPinnedHeader';
import { StatusView } from '@/components/StatusView';

interface FeedScreenProps {
  state: FeedState;
  isRefreshing: boolean;
  isSearching: boolean;
  onRefresh: () => void;
  onPressActivity: (id: string) => void;
  isSearchOpen: boolean;
  onOpenSearch: () => void;
  onCloseSearch: () => void;
  query: string;
  filter: ActivityFilter;
  onQueryChange: (query: string) => void;
  onFilterChange: (filter: ActivityFilter) => void;
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMoreError: string | null;
  onClearSearch: () => void;
  onShowAll: () => void;
}

export function FeedScreen({
  state,
  isRefreshing,
  isSearching,
  onRefresh,
  onPressActivity,
  isSearchOpen,
  onOpenSearch,
  onCloseSearch,
  query,
  filter,
  onQueryChange,
  onFilterChange,
  onLoadMore,
  hasMore,
  isLoadingMore,
  loadMoreError,
  onClearSearch,
  onShowAll,
}: FeedScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const listRef = useRef<Animated.FlatList<Activity>>(null);
  const loadMoreInFlight = useRef(false);
  const collapsingHeader = useCollapsingHeader();
  const { measuredControlsHeight, measuredHeaderHeight, onScroll } = collapsingHeader;
  const activities = state.status === 'ready' ? state.activities : [];
  const fetchedAt = state.status === 'ready' ? state.fetchedAt : undefined;

  useEffect(() => {
    listRef.current?.scrollToOffset({ animated: true, offset: 0 });
  }, [filter]);

  const requestMore = useCallback(() => {
    if (loadMoreInFlight.current || isLoadingMore) return;

    loadMoreInFlight.current = true;
    void Promise.resolve(onLoadMore()).finally(() => {
      loadMoreInFlight.current = false;
    });
  }, [isLoadingMore, onLoadMore]);

  const handleEndReached = useCallback(() => {
    if (!hasMore || activities.length === 0) return;

    requestMore();
  }, [activities.length, hasMore, requestMore]);

  const renderItem = useCallback<ListRenderItem<Activity>>(
    ({ item, index }) => <FeedItem activity={item} index={index} onPress={onPressActivity} />,
    [onPressActivity],
  );

  const emptyComponent = useMemo(() => {
    if (state.status === 'loading') return <StatusView kind="loading" />;
    if (state.status === 'error') {
      return <StatusView kind="error" message={state.message} onRetry={onRefresh} />;
    }
    if (state.status !== 'empty') return null;

    if (state.reason === 'feed-empty') {
      return <StatusView kind="empty" onRetry={onRefresh} />;
    }

    const title = state.query
      ? `No results for "${state.query}"`
      : state.filter === 'events'
        ? 'No events loaded yet'
        : 'No news loaded yet';
    const message = state.query
      ? 'Try a different search or clear it to see more stories.'
      : state.filter === 'events'
        ? 'There are no campus events to show right now.'
        : 'There is no campus news to show right now.';
    const actions = [];
    if (state.query) actions.push({ label: 'Clear search', onPress: onClearSearch });
    if (state.filter !== 'all') actions.push({ label: 'Show all', onPress: onShowAll });
    if (hasMore) actions.push({ label: 'Load more', onPress: onLoadMore });

    return <StatusView kind="empty" title={title} message={message} actions={actions} />;
  }, [hasMore, onClearSearch, onLoadMore, onRefresh, onShowAll, state]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.FlatList
        ref={listRef}
        data={activities}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={emptyComponent}
        ListFooterComponent={
          <FeedFooter
            hasItems={activities.length > 0}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            loadMoreError={loadMoreError}
            onRetry={requestMore}
          />
        }
        ItemSeparatorComponent={FeedItemSeparator}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: insets.top + measuredControlsHeight + measuredHeaderHeight,
          },
          activities.length === 0 && styles.emptyList,
        ]}
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        onScroll={onScroll}
        progressViewOffset={insets.top + measuredHeaderHeight + measuredControlsHeight}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior="never"
        accessibilityLabel="Campus stories"
      />
      <FeedPinnedHeader
        collapsingHeader={collapsingHeader}
        date={fetchedAt}
        filter={filter}
        insetsTop={insets.top}
        isSearching={isSearching}
        isSearchOpen={isSearchOpen}
        onCloseSearch={onCloseSearch}
        onFilterChange={onFilterChange}
        onOpenSearch={onOpenSearch}
        onQueryChange={onQueryChange}
        query={query}
      />
    </View>
  );
}

function FeedItemSeparator() {
  const theme = useTheme();

  return <View style={[styles.separator, { backgroundColor: theme.colors.hairline }]} />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  emptyList: { flexGrow: 1 },
  separator: { height: StyleSheet.hairlineWidth },
});
