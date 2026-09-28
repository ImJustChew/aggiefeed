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
import type { FeedSearch } from '@/components/FeedSearchRow';
import { StatusView } from '@/components/StatusView';

export interface FeedPagination {
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMoreError: string | null;
  onLoadMore: () => Promise<void>;
}

interface FeedScreenProps {
  state: FeedState;
  filter: ActivityFilter;
  onFilterChange: (filter: ActivityFilter) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  onShowAll: () => void;
  onPressActivity: (id: string) => void;
  search: FeedSearch;
  pagination: FeedPagination;
}

export function FeedScreen({
  state,
  filter,
  onFilterChange,
  isRefreshing,
  onRefresh,
  onShowAll,
  onPressActivity,
  search,
  pagination,
}: FeedScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const listRef = useRef<Animated.FlatList<Activity>>(null);
  const collapsingHeader = useCollapsingHeader();
  const { measuredControlsHeight, measuredHeaderHeight, onScroll } = collapsingHeader;
  const activities = state.status === 'ready' ? state.activities : [];
  const fetchedAt = state.status === 'ready' ? state.fetchedAt : undefined;
  const { hasMore, isLoadingMore, loadMoreError, onLoadMore } = pagination;

  useEffect(() => {
    listRef.current?.scrollToOffset({ animated: true, offset: 0 });
  }, [filter]);

  const handleEndReached = useCallback(() => {
    if (!hasMore || activities.length === 0) return;

    void onLoadMore();
  }, [activities.length, hasMore, onLoadMore]);

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
    if (state.query) actions.push({ label: 'Clear search', onPress: search.onClear });
    if (state.filter !== 'all') actions.push({ label: 'Show all', onPress: onShowAll });
    if (hasMore) actions.push({ label: 'Load more', onPress: onLoadMore });

    return <StatusView kind="empty" title={title} message={message} actions={actions} />;
  }, [hasMore, onLoadMore, onRefresh, onShowAll, search.onClear, state]);

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
            onRetry={onLoadMore}
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
        onFilterChange={onFilterChange}
        search={search}
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
