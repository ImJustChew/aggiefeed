import { useEffect, useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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

export interface FeedSearch {
  query: string;
  isOpen: boolean;
  isSearching: boolean;
  onOpen: () => void;
  onClose: () => void;
  onQueryChange: (query: string) => void;
  onClear: () => void;
}

interface FeedSearchRowProps {
  collapseDistance: SharedValue<number>;
  search: FeedSearch;
  scrollY: SharedValue<number>;
}

export function FeedSearchRow({ collapseDistance, search, scrollY }: FeedSearchRowProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const inputRef = useRef<TextInput>(null);
  const modeProgress = useSharedValue(search.isOpen ? 1 : 0);

  useEffect(() => {
    const target = search.isOpen ? 1 : 0;
    modeProgress.set(
      reducedMotion
        ? target
        : withTiming(target, {
            duration: 250,
            easing: Easing.out(Easing.cubic),
          }),
    );

    if (search.isOpen) {
      inputRef.current?.focus();
    } else {
      inputRef.current?.blur();
    }
  }, [modeProgress, reducedMotion, search.isOpen]);

  const titleScaleStyle = useAnimatedStyle(() => {
    const range = collapseDistance.value;
    if (range <= 0) return { transform: [{ scale: 1 }] };

    return {
      transform: [
        { scale: interpolate(scrollY.value, [0, range], [1, 0.65], Extrapolation.CLAMP) },
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
    <>
      <Animated.View
        accessibilityElementsHidden={search.isOpen}
        importantForAccessibility={search.isOpen ? 'no-hide-descendants' : 'yes'}
        pointerEvents={search.isOpen ? 'none' : 'auto'}
        style={[styles.modeLayer, wordmarkModeStyle]}
      >
        <Animated.View testID="feed-header-title" style={[styles.titleSlot, titleScaleStyle]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>AggieFeed</Text>
        </Animated.View>
        <Pressable
          accessibilityLabel="Search stories"
          accessibilityRole="button"
          hitSlop={8}
          onPress={search.onOpen}
          style={styles.iconButton}
        >
          <Ionicons color={theme.colors.text} name="search" size={22} />
        </Pressable>
      </Animated.View>

      <Animated.View
        accessibilityElementsHidden={!search.isOpen}
        importantForAccessibility={search.isOpen ? 'yes' : 'no-hide-descendants'}
        pointerEvents={search.isOpen ? 'auto' : 'none'}
        style={[styles.modeLayer, searchModeStyle]}
      >
        <View style={[styles.searchField, { borderBottomColor: theme.colors.hairline }]}>
          <TextInput
            accessibilityLabel="Search stories"
            ref={inputRef}
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={search.onQueryChange}
            placeholder="Search campus stories"
            placeholderTextColor={theme.colors.textTertiary}
            returnKeyType="search"
            style={[styles.input, { color: theme.colors.text }]}
            testID="feed-search-input"
            value={search.query}
          />
          {search.query.length > 0 ? (
            <Pressable
              accessibilityLabel="Clear search"
              accessibilityRole="button"
              hitSlop={8}
              onPress={search.onClear}
              style={styles.clearButton}
            >
              <Text style={[styles.clearText, { color: theme.colors.textSecondary }]}>×</Text>
            </Pressable>
          ) : null}
          {search.isSearching ? (
            <ActivityIndicator
              accessibilityLabel="Searching stories"
              accessibilityRole="progressbar"
              color={theme.colors.accent}
              size="small"
              style={styles.searchIndicator}
            />
          ) : null}
        </View>
        <Pressable
          accessibilityLabel="Cancel"
          accessibilityRole="button"
          onPress={search.onClose}
          style={styles.cancelButton}
        >
          <Text style={[styles.cancelText, { color: theme.colors.textSecondary }]}>Cancel</Text>
        </Pressable>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
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
  searchIndicator: { marginHorizontal: spacing.sm },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 64,
    paddingLeft: spacing.md,
  },
  cancelText: { fontFamily: fonts.medium, fontSize: 14 },
});
