import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts, spacing, useTheme } from '@/theme';

interface FeedFooterProps {
  hasItems: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMoreError: string | null;
  onRetry: () => void;
}

export function FeedFooter({
  hasItems,
  hasMore,
  isLoadingMore,
  loadMoreError,
  onRetry,
}: FeedFooterProps) {
  const theme = useTheme();

  if (isLoadingMore) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          accessibilityLabel="Loading more stories"
          accessibilityRole="progressbar"
          color={theme.colors.accent}
          size="small"
        />
      </View>
    );
  }

  if (loadMoreError) {
    return (
      <View style={styles.error}>
        <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
          Couldn&apos;t load more stories
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retry"
          onPress={onRetry}
          style={styles.retry}
        >
          <Text style={[styles.retryText, { color: theme.colors.accent }]}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (hasItems && !hasMore) {
    return (
      <View style={styles.endMarker}>
        <Text style={[styles.endText, { color: theme.colors.textTertiary }]}>
          You&apos;re all caught up
        </Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  loading: { alignItems: 'center', minHeight: 52, justifyContent: 'center' },
  error: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 52,
    gap: spacing.md,
  },
  errorText: { fontFamily: fonts.regular, fontSize: 13 },
  retry: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.sm },
  retryText: { fontFamily: fonts.semibold, fontSize: 14 },
  endMarker: { alignItems: 'center', minHeight: 52, justifyContent: 'center' },
  endText: { fontFamily: fonts.regular, fontSize: 13 },
});
