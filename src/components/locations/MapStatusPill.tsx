import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts, spacing, useTheme } from '@/theme';

import { STATUS_PILL_TOP_OFFSET } from './layout';

interface MapStatusPillProps {
  kind: 'loading' | 'error';
  onRetry?: () => void;
  topInset: number;
}

export function MapStatusPill({ kind, onRetry, topInset }: MapStatusPillProps) {
  const theme = useTheme();
  const content = (
    <>
      <Ionicons
        color={theme.colors.textSecondary}
        name={kind === 'loading' ? 'ellipsis-horizontal-circle-outline' : 'refresh-outline'}
        size={16}
      />
      <Text style={[styles.text, { color: theme.colors.text }]}>
        {kind === 'loading' ? 'Loading locations…' : 'Couldn’t load · Retry'}
      </Text>
    </>
  );
  const positionStyle = {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.hairline,
    top: topInset + STATUS_PILL_TOP_OFFSET,
  };

  if (kind === 'error') {
    return (
      <Pressable
        accessibilityLabel="Could not load locations. Tap to retry."
        accessibilityRole="button"
        onPress={onRetry}
        style={[styles.pill, styles.pressable, positionStyle]}
        testID="locations-error-retry"
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      accessibilityLabel="Loading locations"
      pointerEvents="none"
      style={[styles.pill, positionStyle]}
      testID="locations-loading-pill"
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 3,
    flexDirection: 'row',
    gap: spacing.xs,
    left: spacing.lg,
    minHeight: 32,
    paddingHorizontal: spacing.md,
    position: 'absolute',
    shadowColor: '#000000',
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 3,
    zIndex: 2,
  },
  pressable: { paddingVertical: spacing.xs },
  text: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
});
