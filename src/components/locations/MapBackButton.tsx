import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet } from 'react-native';

import { spacing, useTheme } from '@/theme';

interface MapBackButtonProps {
  onPress: () => void;
  topInset: number;
}

export function MapBackButton({ onPress, topInset }: MapBackButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityLabel="Back"
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.hairline,
          left: spacing.lg,
          top: topInset + spacing.sm,
        },
      ]}
      testID="locations-back-button"
    >
      <Ionicons color={theme.colors.text} name="chevron-back" size={22} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 3,
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    shadowColor: '#000000',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    width: 44,
    zIndex: 3,
  },
});
