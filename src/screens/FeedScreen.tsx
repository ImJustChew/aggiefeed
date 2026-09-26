import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import type { Activity, ActivityFilter } from '@/domain/activity';
import type { FeedState } from '@/hooks/useActivities';
import { spacing, useTheme } from '@/theme';

import { FeedControls } from '@/components/FeedControls';
import { FeedFooter } from '@/components/FeedFooter';
import { FeedHeader } from '@/components/FeedHeader';
import { FeedItem } from '@/components/FeedItem';
import { StatusView } from '@/components/StatusView';

interface FeedScreenProps {
  state: FeedState;
  isRefreshing: boolean;
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
  const scrollY = useSharedValue(0);
  const headerHeight = useSharedValue(0);
  const collapseDistance = useSharedValue(0);
  const measuredHeaderHeightRef = useRef(0);
  const measuredWordmarkRowHeightRef = useRef(0);
  const [measuredControlsHeight, setMeasuredControlsHeight] = useState(0);
  const [measuredHeaderHeight, setMeasuredHeaderHeight] = useState(0);
  const activities = state.status === 'ready' ? state.activities : [];
  const fetchedAt = state.status === 'ready' ? state.fetchedAt : undefined;

  const handleControlsLayout = useCallback((event: LayoutChangeEvent) => {
    setMeasuredControlsHeight(event.nativeEvent.layout.height);
  }, []);

  const handleHeaderLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const nextHeight = event.nativeEvent.layout.height;
      if (nextHeight <= 0 || measuredHeaderHeightRef.current > 0) return;

      measuredHeaderHeightRef.current = nextHeight;
      headerHeight.set(nextHeight);
      collapseDistance.set(Math.max(0, nextHeight - measuredWordmarkRowHeightRef.current));
      setMeasuredHeaderHeight(nextHeight);
    },
    [collapseDistance, headerHeight],
  );

  const handleWordmarkRowLayout = useCallback(
    (nextHeight: number) => {
      if (nextHeight <= 0 || measuredWordmarkRowHeightRef.current === nextHeight) return;

      measuredWordmarkRowHeightRef.current = nextHeight;
      if (measuredHeaderHeightRef.current > 0) {
        collapseDistance.set(Math.max(0, measuredHeaderHeightRef.current - nextHeight));
      }
    },
    [collapseDistance],
  );

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = Math.max(0, event.contentOffset.y);
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    if (headerHeight.value === 0) return {};

    const collapseRange = collapseDistance.value;
    if (collapseRange <= 0) return { height: headerHeight.value };

    const collapseOffset = interpolate(
      scrollY.value,
      [0, collapseRange],
      [0, collapseRange],
      Extrapolation.CLAMP,
    );

    return { height: headerHeight.value - collapseOffset };
  });

  const controlsAnimatedStyle = useAnimatedStyle(() => {
    if (headerHeight.value === 0) return {};

    const collapseRange = collapseDistance.value;
    if (collapseRange <= 0) return { transform: [{ translateY: 0 }] };

    const collapseOffset = interpolate(
      scrollY.value,
      [0, collapseRange],
      [0, collapseRange],
      Extrapolation.CLAMP,
    );

    return { transform: [{ translateY: -collapseOffset }] };
  });

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

    return <StatusView kind="empty" title={title} message={message} actions={actions} />;
  }, [onClearSearch, onRefresh, onShowAll, state]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.FlatList
        ref={listRef}
        data={activities}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <FeedItem activity={item} index={index} onPress={onPressActivity} />
        )}
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
      <View
        onLayout={handleHeaderLayout}
        pointerEvents="box-none"
        style={[
          styles.headerMeasurement,
          { height: measuredHeaderHeight || undefined, top: insets.top },
        ]}
      >
        <Animated.View
          style={[
            styles.collapsingHeader,
            { backgroundColor: theme.colors.background },
            headerAnimatedStyle,
          ]}
        >
          <FeedHeader
            collapseDistance={collapseDistance}
            date={fetchedAt}
            isSearchOpen={isSearchOpen}
            onCloseSearch={onCloseSearch}
            onOpenSearch={onOpenSearch}
            onQueryChange={onQueryChange}
            onRowLayout={handleWordmarkRowLayout}
            query={query}
            scrollY={scrollY}
          />
        </Animated.View>
      </View>
      <Animated.View
        onLayout={handleControlsLayout}
        style={[
          styles.controls,
          {
            backgroundColor: theme.colors.background,
            top: insets.top + measuredHeaderHeight,
          },
          controlsAnimatedStyle,
        ]}
      >
        <FeedControls filter={filter} onFilterChange={onFilterChange} />
      </Animated.View>
      <View
        pointerEvents="none"
        style={[
          styles.statusBarBackground,
          { backgroundColor: theme.colors.background, height: insets.top },
        ]}
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
  headerMeasurement: {
    left: 0,
    position: 'absolute',
    right: 0,
  },
  controls: {
    left: 0,
    paddingHorizontal: spacing.lg,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 2,
  },
  statusBarBackground: {
    elevation: 3,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 3,
  },
  collapsingHeader: {
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
    width: '100%',
    zIndex: 1,
  },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  emptyList: { flexGrow: 1 },
  separator: { height: StyleSheet.hairlineWidth },
});
