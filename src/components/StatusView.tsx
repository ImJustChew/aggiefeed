import { StyleSheet, Text, View } from 'react-native';

import { fonts, spacing, useTheme } from '@/theme';

import { AnimatedPressable } from './AnimatedPressable';
import { LoadingSkeleton } from './LoadingSkeleton';

interface StatusViewProps {
  kind: 'loading' | 'error' | 'empty' | 'not-found';
  title?: string;
  message?: string;
  actions?: StatusAction[];
  onRetry?: () => void;
}

interface StatusAction {
  label: string;
  onPress: () => void;
}

const statusCopy = {
  loading: { title: 'Loading stories', message: 'Fetching the latest from campus.' },
  error: { title: 'Unable to load stories', message: 'Please try again.' },
  empty: { title: 'No stories yet', message: 'Check back soon for campus news and events.' },
  'not-found': {
    title: 'Activity not found',
    message: 'This story is no longer available in the public feed.',
  },
};

export function StatusView({ kind, title, message, actions, onRetry }: StatusViewProps) {
  const theme = useTheme();
  const copy = statusCopy[kind];
  const isLoading = kind === 'loading';
  const isError = kind === 'error';
  const displayTitle = title ?? copy.title;
  const detail = message ?? copy.message;
  const actionLabel = isError ? 'Retry' : kind === 'empty' ? 'Refresh' : null;
  const defaultActions = actionLabel && onRetry ? [{ label: actionLabel, onPress: onRetry }] : [];
  const displayActions = actions ?? defaultActions;

  return (
    <View style={styles.container}>
      {isLoading ? <LoadingSkeleton /> : null}
      <View
        accessible
        accessibilityRole={isLoading ? 'progressbar' : 'alert'}
        accessibilityLiveRegion={isError ? 'assertive' : 'polite'}
        accessibilityLabel={`${displayTitle}. ${detail}`}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>{displayTitle}</Text>
        <Text style={[styles.message, { color: theme.colors.textSecondary }]}>{detail}</Text>
      </View>
      {displayActions.map((action, index) => (
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel={action.label}
          key={action.label}
          onPress={action.onPress}
          style={[
            styles.retry,
            index > 0
              ? { borderColor: theme.colors.hairline, borderWidth: StyleSheet.hairlineWidth }
              : { backgroundColor: theme.colors.accent },
          ]}
        >
          <Text
            style={[
              styles.retryText,
              { color: index > 0 ? theme.colors.text : theme.colors.accentText },
            ]}
          >
            {action.label}
          </Text>
        </AnimatedPressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  title: { fontFamily: fonts.semibold, fontSize: 20, lineHeight: 26, marginTop: spacing.xl },
  message: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, marginTop: spacing.sm },
  retry: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignSelf: 'flex-start',
  },
  retryText: { fontFamily: fonts.semibold, fontSize: 15 },
});
