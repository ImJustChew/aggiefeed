import type { ActivityFilter } from '@/domain/activity';
import type { useCollapsingHeader } from '@/hooks/useCollapsingHeader';
import { spacing, useTheme } from '@/theme';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { FeedControls } from './FeedControls';
import { FeedHeader } from './FeedHeader';
import type { FeedSearch } from './FeedSearchRow';

type CollapsingHeader = ReturnType<typeof useCollapsingHeader>;

interface FeedPinnedHeaderProps {
  collapsingHeader: CollapsingHeader;
  date?: Date;
  filter: ActivityFilter;
  insetsTop: number;
  search: FeedSearch;
  onFilterChange: (filter: ActivityFilter) => void;
}

export function FeedPinnedHeader({
  collapsingHeader,
  date,
  filter,
  insetsTop,
  search,
  onFilterChange,
}: FeedPinnedHeaderProps) {
  const theme = useTheme();
  const {
    collapseDistance,
    controlsAnimatedStyle,
    handleControlsLayout,
    handleHeaderLayout,
    handleWordmarkRowLayout,
    headerAnimatedStyle,
    measuredHeaderHeight,
    scrollY,
  } = collapsingHeader;

  return (
    <>
      <View
        onLayout={handleHeaderLayout}
        pointerEvents="box-none"
        style={[
          styles.headerMeasurement,
          { height: measuredHeaderHeight || undefined, top: insetsTop },
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
            date={date}
            onRowLayout={handleWordmarkRowLayout}
            search={search}
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
            top: insetsTop + measuredHeaderHeight,
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
          { backgroundColor: theme.colors.background, height: insetsTop },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerMeasurement: { left: 0, position: 'absolute', right: 0 },
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
});
