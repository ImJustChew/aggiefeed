import { StyleSheet, Text, View } from 'react-native';

import { fonts, spacing, useTheme } from '@/theme';

import { StatusView } from '@/components/StatusView';

interface LocationsListEmptyStateProps {
  errorMessage?: string;
  onRetry: () => void;
  query: string;
  status: 'loading' | 'error' | 'ready';
}

export function LocationsListEmptyState({
  errorMessage,
  onRetry,
  query,
  status,
}: LocationsListEmptyStateProps) {
  const theme = useTheme();

  if (status === 'loading') {
    return (
      <View style={styles.container} testID="locations-loading-list-state">
        <Text style={[styles.loadingMessage, { color: theme.colors.textSecondary }]}>
          Loading the campus directory…
        </Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.container}>
        <StatusView
          kind="error"
          message={errorMessage ?? 'Unable to load locations.'}
          onRetry={onRetry}
          title="Unable to load locations"
        />
      </View>
    );
  }

  const trimmedQuery = query.trim();
  const title = trimmedQuery ? `No locations for “${trimmedQuery}”` : 'No locations available';
  const message = trimmedQuery
    ? 'Try a different name, category, or building code.'
    : 'The campus directory is empty right now.';

  return (
    <View style={styles.container}>
      <StatusView kind="empty" message={message} onRetry={onRetry} title={title} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { minHeight: 240, paddingHorizontal: spacing.lg },
  loadingMessage: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    paddingTop: spacing.xl,
  },
});
