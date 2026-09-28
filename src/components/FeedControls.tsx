import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { ActivityFilter } from '@/domain/activity';
import { fonts, spacing, useTheme } from '@/theme';

const FILTER_OPTIONS: readonly { label: string; value: ActivityFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'News', value: 'news' },
  { label: 'Events', value: 'events' },
];

interface FeedControlsProps {
  filter: ActivityFilter;
  onFilterChange: (filter: ActivityFilter) => void;
}

export function FeedControls({ filter, onFilterChange }: FeedControlsProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const [tabsWidth, setTabsWidth] = useState(0);
  const selectedIndex = FILTER_OPTIONS.findIndex((option) => option.value === filter);
  const tabWidth = tabsWidth / FILTER_OPTIONS.length;
  const indicatorX = useSharedValue(selectedIndex * tabWidth);
  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  useEffect(() => {
    const nextX = selectedIndex * tabWidth;
    indicatorX.set(reducedMotion ? nextX : withTiming(nextX, { duration: 220 }));
  }, [indicatorX, reducedMotion, selectedIndex, tabWidth]);

  return (
    <View style={styles.container}>
      <View
        accessibilityLabel="Story type"
        accessibilityRole="tablist"
        onLayout={({ nativeEvent }) => setTabsWidth(nativeEvent.layout.width)}
        style={[styles.tabs, { borderBottomColor: theme.colors.hairline }]}
      >
        {FILTER_OPTIONS.map((option) => {
          const isSelected = option.value === filter;

          return (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              key={option.value}
              onPress={() => onFilterChange(option.value)}
              style={styles.tab}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isSelected ? theme.colors.text : theme.colors.textTertiary },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
        {tabWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.indicator,
              { backgroundColor: theme.colors.accent, width: tabWidth },
              indicatorStyle,
            ]}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: spacing.sm },
  tabs: {
    flexDirection: 'row',
    minHeight: 44,
    position: 'relative',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: { alignItems: 'center', flex: 1, justifyContent: 'center', minHeight: 44 },
  tabText: { fontFamily: fonts.medium, fontSize: 14 },
  indicator: { bottom: -StyleSheet.hairlineWidth, height: 1, left: 0, position: 'absolute' },
});
