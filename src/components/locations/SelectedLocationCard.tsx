import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { locationDisplayName, locationSubtitle, type Location } from '@/domain/location';
import { fonts, spacing, useTheme } from '@/theme';

interface SelectedLocationCardProps {
  location: Location;
  onClear: () => void;
}

export function SelectedLocationCard({ location, onClear }: SelectedLocationCardProps) {
  const theme = useTheme();
  const title = locationDisplayName(location);
  const subtitle = locationSubtitle(location);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.hairline },
      ]}
      testID="selected-location-card"
    >
      <View style={styles.copy}>
        <Text numberOfLines={2} style={[styles.name, { color: theme.colors.text }]}>
          {title}
        </Text>
        <Text numberOfLines={2} style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {subtitle}
        </Text>
        {location.description ? (
          <Text
            numberOfLines={2}
            style={[styles.description, { color: theme.colors.textSecondary }]}
          >
            {location.description}
          </Text>
        ) : null}
      </View>
      {location.imageUrl ? (
        <Image
          accessibilityLabel={title + ' image'}
          source={{ uri: location.imageUrl }}
          style={styles.image}
        />
      ) : null}
      <Pressable
        accessibilityLabel="Clear selected location"
        accessibilityRole="button"
        hitSlop={8}
        onPress={onClear}
        style={styles.clearButton}
      >
        <Text style={[styles.clearButtonText, { color: theme.colors.accent }]}>Clear</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 105,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  copy: { flex: 1, paddingRight: spacing.sm },
  name: { fontFamily: fonts.serifBold, fontSize: 20, lineHeight: 24, marginTop: 2 },
  subtitle: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, marginTop: 3 },
  description: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, marginTop: 3 },
  image: { borderRadius: 9, height: 58, marginLeft: spacing.sm, width: 58 },
  clearButton: { alignSelf: 'flex-start', marginLeft: spacing.sm, marginTop: 2 },
  clearButtonText: { fontFamily: fonts.semibold, fontSize: 12 },
});
