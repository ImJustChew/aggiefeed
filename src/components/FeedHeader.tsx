import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

import { fonts, spacing, useTheme } from '@/theme';
import { formatFeedDate } from '@/ui/activityPresentation';

import { AnimatedReveal } from './AnimatedReveal';

interface FeedHeaderProps {
  date?: Date;
  isSearchOpen?: boolean;
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
  onOpenSearch,
  onCloseSearch,
  onQueryChange,
  query = '',
  scrollY,
  collapseDistance,
  onRowLayout,
}: FeedHeaderProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const inputRef = useRef<TextInput>(null);
  const internalScrollY = useSharedValue(0);
  const internalCollapseDistance = useSharedValue(0);
  const activeScrollY = scrollY ?? internalScrollY;
  const activeCollapseDistance = collapseDistance ?? internalCollapseDistance;
  const modeProgress = useSharedValue(isSearchOpen ? 1 : 0);
  const [rowOffset, setRowOffset] = useState(0);

  useEffect(() => {
    const target = isSearchOpen ? 1 : 0;
    modeProgress.set(
      reducedMotion
        ? target
        : withTiming(target, {
            duration: 250,
            easing: Easing.out(Easing.cubic),
          }),
    );

    if (isSearchOpen) {
      inputRef.current?.focus();
    } else {
      inputRef.current?.blur();
    }
  }, [isSearchOpen, modeProgress, reducedMotion]);

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

    const offset = interpolate(activeScrollY.value, [0, range], [0, range], Extrapolation.CLAMP);

    return {
      opacity: interpolate(offset, [0, range * 0.45], [1, 0], Extrapolation.CLAMP),
      transform: [{ translateY: -offset * 0.45 }],
    };
  });

  const rowStyle = useAnimatedStyle(() => {
    const range = activeCollapseDistance.value;
    if (range <= 0) return { transform: [{ translateY: 0 }] };

    const offset = interpolate(activeScrollY.value, [0, range], [0, range], Extrapolation.CLAMP);

    return { transform: [{ translateY: -Math.min(offset, rowOffset) }] };
  }, [rowOffset]);

  const subtitleStyle = useAnimatedStyle(() => {
    const range = activeCollapseDistance.value;
    if (range <= 0) {
      return { opacity: 1, transform: [{ translateY: 0 }] };
    }

    const offset = interpolate(activeScrollY.value, [0, range], [0, range], Extrapolation.CLAMP);

    return {
      opacity: interpolate(offset, [0, range * 0.7], [1, 0], Extrapolation.CLAMP),
      transform: [{ translateY: -offset * 0.35 }],
    };
  });

  const titleScaleStyle = useAnimatedStyle(() => {
    const range = activeCollapseDistance.value;
    if (range <= 0) return { transform: [{ scale: 1 }] };

    return {
      transform: [
        {
          scale: interpolate(activeScrollY.value, [0, range], [1, 0.65], Extrapolation.CLAMP),
        },
      ],
    };
  });

  const wordmarkModeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(modeProgress.value, [0, 1], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateX: interpolate(modeProgress.value, [0, 1], [0, -24], Extrapolation.CLAMP),
      },
    ],
  }));

  const searchModeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(modeProgress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateX: interpolate(modeProgress.value, [0, 1], [24, 0], Extrapolation.CLAMP),
      },
    ],
  }));

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
        <Animated.View
          accessibilityElementsHidden={isSearchOpen}
          importantForAccessibility={isSearchOpen ? 'no-hide-descendants' : 'yes'}
          pointerEvents={isSearchOpen ? 'none' : 'auto'}
          style={[styles.modeLayer, wordmarkModeStyle]}
        >
          <Animated.View testID="feed-header-title" style={[styles.titleSlot, titleScaleStyle]}>
            <Text style={[styles.title, { color: theme.colors.text }]}>AggieFeed</Text>
          </Animated.View>
          <Pressable
            accessibilityLabel="Search stories"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onOpenSearch}
            style={styles.iconButton}
          >
            <Ionicons color={theme.colors.text} name="search" size={22} />
          </Pressable>
        </Animated.View>

        <Animated.View
          accessibilityElementsHidden={!isSearchOpen}
          importantForAccessibility={isSearchOpen ? 'yes' : 'no-hide-descendants'}
          pointerEvents={isSearchOpen ? 'auto' : 'none'}
          style={[styles.modeLayer, searchModeStyle]}
        >
          <View style={[styles.searchField, { borderBottomColor: theme.colors.hairline }]}>
            <TextInput
              accessibilityLabel="Search stories"
              ref={inputRef}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus={isSearchOpen}
              onChangeText={onQueryChange}
              placeholder="Search campus stories"
              placeholderTextColor={theme.colors.textTertiary}
              returnKeyType="search"
              style={[styles.input, { color: theme.colors.text }]}
              testID="feed-search-input"
              value={query}
            />
            {query.length > 0 ? (
              <Pressable
                accessibilityLabel="Clear search"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => onQueryChange?.('')}
                style={styles.clearButton}
              >
                <Text style={[styles.clearText, { color: theme.colors.textSecondary }]}>×</Text>
              </Pressable>
            ) : null}
          </View>
          <Pressable
            accessibilityLabel="Cancel"
            accessibilityRole="button"
            onPress={onCloseSearch}
            style={styles.cancelButton}
          >
            <Text style={[styles.cancelText, { color: theme.colors.textSecondary }]}>Cancel</Text>
          </Pressable>
        </Animated.View>
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
  modeLayer: {
    alignItems: 'center',
    flexDirection: 'row',
    height: '100%',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  titleSlot: { flex: 1, justifyContent: 'center', transformOrigin: 'left center' },
  title: { fontFamily: fonts.serifSemibold, fontSize: 40, lineHeight: 46 },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  searchField: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    minHeight: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    minHeight: 44,
    paddingVertical: spacing.sm,
  },
  clearButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  clearText: { fontFamily: fonts.regular, fontSize: 26, lineHeight: 30 },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 64,
    paddingLeft: spacing.md,
  },
  cancelText: { fontFamily: fonts.medium, fontSize: 14 },
  subtitleBlock: { marginTop: spacing.sm, minHeight: 22 },
  subtitle: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
});
