import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { LocationCategory } from '@/domain/location';
import { fonts, spacing, useTheme } from '@/theme';

import { categoryPinColor } from './mapColors';
import {
  CATEGORY_CHIP_HEIGHT,
  CATEGORY_CHIPS_TOP,
  SEARCH_BAR_HEIGHT,
  SEARCH_CONTROLS_TOP,
} from './layout';

interface MapSearchControlsProps {
  categories: LocationCategory[];
  onChangeQuery: (query: string) => void;
  onSelectCategory: (categoryId: string | null) => void;
  query: string;
  selectedCategoryId: string | null;
  topInset: number;
}

export function MapSearchControls({
  categories,
  onChangeQuery,
  onSelectCategory,
  query,
  selectedCategoryId,
  topInset,
}: MapSearchControlsProps) {
  const theme = useTheme();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, { top: topInset + SEARCH_CONTROLS_TOP }]}
    >
      <View
        style={[
          styles.searchBar,
          { backgroundColor: theme.colors.background, borderColor: theme.colors.hairline },
        ]}
      >
        <Ionicons color={theme.colors.textSecondary} name="search-outline" size={19} />
        <TextInput
          accessibilityLabel="Search campus locations"
          accessibilityRole="search"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={onChangeQuery}
          placeholder="Search locations"
          placeholderTextColor={theme.colors.textTertiary}
          returnKeyType="search"
          style={[styles.searchInput, { color: theme.colors.text }]}
          testID="locations-search-input"
          value={query}
        />
        {query.length > 0 ? (
          <Pressable
            accessibilityLabel="Clear search"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => onChangeQuery('')}
            style={styles.clearSearchButton}
            testID="locations-search-clear"
          >
            <Ionicons color={theme.colors.textTertiary} name="close-circle" size={20} />
          </Pressable>
        ) : null}
      </View>
      <ScrollView
        contentContainerStyle={styles.categoryChipRow}
        horizontal
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
        style={[styles.categoryScroll, { top: CATEGORY_CHIPS_TOP }]}
        testID="locations-category-scroll"
      >
        <CategoryChip
          label="All"
          onPress={() => onSelectCategory(null)}
          selected={selectedCategoryId === null}
        />
        {categories.map((category) => (
          <CategoryChip
            key={category.id}
            dotColor={categoryPinColor(category.id)}
            label={category.name}
            onPress={() => onSelectCategory(category.id)}
            selected={selectedCategoryId === category.id}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function CategoryChip({
  label,
  onPress,
  selected,
  dotColor,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
  dotColor?: string;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.categoryChip,
        {
          backgroundColor: selected ? theme.colors.accent : theme.colors.background,
          borderColor: selected ? theme.colors.accent : theme.colors.hairline,
        },
      ]}
    >
      {dotColor ? <View style={[styles.categoryChipDot, { backgroundColor: dotColor }]} /> : null}
      <Text
        style={[
          styles.categoryChipLabel,
          { color: selected ? theme.colors.accentText : theme.colors.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { left: 0, position: 'absolute', right: 0, zIndex: 4 },
  searchBar: {
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 4,
    flexDirection: 'row',
    height: SEARCH_BAR_HEIGHT,
    marginLeft: 72,
    marginRight: spacing.lg,
    paddingHorizontal: spacing.md,
    shadowColor: '#000000',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    paddingVertical: 0,
  },
  clearSearchButton: { alignItems: 'center', height: 32, justifyContent: 'center', width: 28 },
  categoryScroll: { left: 0, position: 'absolute', right: 0 },
  categoryChipRow: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  categoryChip: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    elevation: 2,
    flexDirection: 'row',
    height: CATEGORY_CHIP_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    shadowColor: '#000000',
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  categoryChipDot: { borderRadius: 4, height: 8, marginRight: spacing.xs, width: 8 },
  categoryChipLabel: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
});
