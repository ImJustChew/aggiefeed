import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { locationDisplayName, locationSubtitle, type Location } from '@/domain/location';
import { fonts, spacing, useTheme } from '@/theme';

import { AnimatedPressable } from '../AnimatedPressable';

const LOCATION_ROW_HEIGHT = 82;

interface LocationRowProps {
  location: Location;
  onPress: (id: string) => void;
}

export const LocationRow = memo(function LocationRow({ location, onPress }: LocationRowProps) {
  const theme = useTheme();
  const hasCoordinates = location.coordinates !== null;
  const title = locationDisplayName(location);
  const subtitle = locationSubtitle(location);

  return (
    <AnimatedPressable
      accessibilityLabel={`${title}. ${subtitle}.${hasCoordinates ? '' : ' No map location.'}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: !hasCoordinates }}
      disabled={!hasCoordinates}
      onPress={hasCoordinates ? () => onPress(location.id) : undefined}
      style={[styles.row, { borderBottomColor: theme.colors.hairline }]}
    >
      <View style={styles.copy}>
        <Text numberOfLines={1} style={[styles.name, { color: theme.colors.text }]}>
          {title}
        </Text>
        <Text numberOfLines={1} style={[styles.secondary, { color: theme.colors.textSecondary }]}>
          {subtitle}
        </Text>
      </View>
      <Text
        style={[
          styles.mapStatus,
          { color: hasCoordinates ? theme.colors.accent : theme.colors.textTertiary },
        ]}
      >
        {hasCoordinates ? 'Map' : 'No map location'}
      </Text>
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    height: LOCATION_ROW_HEIGHT,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  copy: { flex: 1, paddingRight: spacing.md },
  name: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 21 },
  secondary: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, marginTop: 3 },
  mapStatus: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
});
