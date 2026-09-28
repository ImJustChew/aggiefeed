import { useCallback, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

import { fonts, spacing, useTheme } from '@/theme';
import { formatFeedDate } from '@/domain/date';
import { getCollapseOffset } from '@/hooks/useCollapsingHeader';

import { AnimatedReveal } from './AnimatedReveal';
import { FeedSearchRow } from './FeedSearchRow';

interface FeedHeaderProps {
  date?: Date;
  isSearchOpen?: boolean;
  isSearching?: boolean;
  onOpenSearch?: () => void;
  onCloseSearch?: () => void;
  onQueryChange?: (query: string) => void;
  query?: string;
  scrollY?: SharedValue<number>;
  collapseDistance?: SharedValue<number>;
  onRowLayout?: (height: number) => void;
}

export function FeedHeader({
  date = new Date(),
  isSearchOpen = false,
  isSearching = false,
  onOpenSearch,
  onCloseSearch,
  onQueryChange,
  query = '',
  scrollY,
  collapseDistance,
  onRowLayout,
}: FeedHeaderProps) {
  const theme = useTheme();
  const internalScrollY = useSharedValue(0);
  const internalCollapseDistance = useSharedValue(0);
  const activeScrollY = scrollY ?? internalScrollY;
  const activeCollapseDistance = collapseDistance ?? internalCollapseDistance;
  const [rowOffset, setRowOffset] = useState(0);

  const handleRowLayout = useCallback(
    (height: number, offset: number) => {
      if (offset !== rowOffset) setRowOffset(offset);
      onRowLayout?.(height);
    },
    [onRowLayout, rowOffset],
  );

  const collapsingStyle = useAnimatedStyle(() => {
    const range = activeCollapseDistance.value;
    if (range <= 0) {
      return { opacity: 1, transform: [{ translateY: 0 }] };
    }

    const offset = getCollapseOffset(activeScrollY.value, range);

    return {
      opacity: interpolate(offset, [0, range * 0.45], [1, 0], Extrapolation.CLAMP),
      transform: [{ translateY: -offset * 0.45 }],
    };
  });

  const rowStyle = useAnimatedStyle(() => {
    const range = activeCollapseDistance.value;
    if (range <= 0) return { transform: [{ translateY: 0 }] };

    const offset = getCollapseOffset(activeScrollY.value, range);

    return { transform: [{ translateY: -Math.min(offset, rowOffset) }] };
  }, [rowOffset]);

  const subtitleStyle = useAnimatedStyle(() => {
    const range = activeCollapseDistance.value;
    if (range <= 0) {
      return { opacity: 1, transform: [{ translateY: 0 }] };
    }

    const offset = getCollapseOffset(activeScrollY.value, range);

    return {
      opacity: interpolate(offset, [0, range * 0.7], [1, 0], Extrapolation.CLAMP),
      transform: [{ translateY: -offset * 0.35 }],
    };
  });

  return (
    <AnimatedReveal style={styles.container}>
      <Animated.View style={[styles.dateBlock, collapsingStyle]}>
        <Text style={[styles.date, { color: theme.colors.textTertiary }]}>
          {formatFeedDate(date)}
        </Text>
      </Animated.View>

      <Animated.View
        onLayout={({ nativeEvent }) =>
          handleRowLayout(nativeEvent.layout.height, nativeEvent.layout.y)
        }
        style={[styles.wordmarkRow, rowStyle]}
      >
        <FeedSearchRow
          collapseDistance={activeCollapseDistance}
          isSearchOpen={isSearchOpen}
          isSearching={isSearching}
          onCloseSearch={onCloseSearch}
          onOpenSearch={onOpenSearch}
          onQueryChange={onQueryChange}
          query={query}
          scrollY={activeScrollY}
        />
      </Animated.View>

      <Animated.View style={[styles.subtitleBlock, subtitleStyle]}>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Campus news and events, in one calm read.
        </Text>
      </Animated.View>
    </AnimatedReveal>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: spacing.lg, paddingBottom: spacing.xl },
  dateBlock: { minHeight: 14 },
  date: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14, letterSpacing: 1.1 },
  wordmarkRow: { height: 64, marginTop: spacing.sm, position: 'relative' },
  subtitleBlock: { marginTop: spacing.sm, minHeight: 22 },
  subtitle: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
});
