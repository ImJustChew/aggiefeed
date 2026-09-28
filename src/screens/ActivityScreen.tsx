import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isEvent } from '@/domain/activity';
import type { ActivityState } from '@/hooks/useActivities';
import { fonts, spacing, useTheme } from '@/theme';
import {
  displayEventLocation,
  displayEventWhen,
  displayActivityType,
  displayObjectType,
  displayPublished,
  displaySource,
  displayTitle,
  fallbackCopy,
} from '@/ui/activityPresentation';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { AnimatedReveal } from '@/components/AnimatedReveal';
import { RichText } from '@/components/RichText';
import { StatusView } from '@/components/StatusView';

interface ActivityScreenProps {
  state: ActivityState;
  onRetry: () => void;
  onOpenUrl: (url: string) => void | Promise<void>;
}

export function ActivityScreen({ state, onRetry, onOpenUrl }: ActivityScreenProps) {
  const theme = useTheme();

  if (state.status !== 'ready') {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['bottom']}
      >
        <View style={styles.statusContent}>
          <StatusView
            kind={state.status}
            message={state.status === 'error' ? state.message : undefined}
            onRetry={state.status === 'error' ? onRetry : undefined}
          />
        </View>
      </SafeAreaView>
    );
  }

  const { activity } = state;
  const title = displayTitle(activity);
  const source = displaySource(activity);
  const type = displayActivityType(activity);
  const objectType = displayObjectType(activity);
  const published = displayPublished(activity.published);
  const storyUrl = activity.url;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <AnimatedReveal>
          <Text
            style={[
              styles.typeLabel,
              { color: isEvent(activity) ? theme.colors.highlight : theme.colors.accent },
            ]}
          >
            {type}
          </Text>
          <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
          <Text style={[styles.byline, { color: theme.colors.textSecondary }]}>By {source}</Text>
          <Text style={[styles.published, { color: theme.colors.textTertiary }]}>{published}</Text>
        </AnimatedReveal>

        {activity.event ? (
          <AnimatedReveal
            delay={60}
            style={[styles.eventBlock, { borderTopColor: theme.colors.hairline }]}
          >
            <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Event details</Text>
            <DetailRow label="When" value={displayEventWhen(activity)} />
            <DetailRow label="Where" value={displayEventLocation(activity)} />
          </AnimatedReveal>
        ) : null}

        <AnimatedReveal delay={120} style={styles.bodyBlock}>
          {activity.summarySegments !== null ? (
            <RichText
              onPressLink={onOpenUrl}
              segments={activity.summarySegments}
              style={[styles.body, { color: theme.colors.text }]}
            />
          ) : (
            <Text style={[styles.body, { color: theme.colors.text }]}>{fallbackCopy.summary}</Text>
          )}
          {storyUrl ? (
            <AnimatedPressable
              accessibilityRole="button"
              accessibilityLabel="Read full story"
              onPress={() => onOpenUrl(storyUrl)}
              style={[styles.linkButton, { backgroundColor: theme.colors.accent }]}
            >
              <Text style={[styles.linkButtonText, { color: theme.colors.accentText }]}>
                Read full story
              </Text>
            </AnimatedPressable>
          ) : null}
        </AnimatedReveal>

        <AnimatedReveal
          delay={180}
          style={[styles.details, { borderTopColor: theme.colors.hairline }]}
        >
          <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Details</Text>
          <DetailRow label="Source" value={source} />
          <DetailRow label="Type" value={objectType} />
          <DetailRow label="Published" value={published} />
        </AnimatedReveal>
      </ScrollView>
    </SafeAreaView>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
}

function DetailRow({ label, value }: DetailRowProps) {
  const theme = useTheme();

  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: theme.colors.textTertiary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: theme.colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  statusContent: { flex: 1, paddingHorizontal: spacing.lg },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: 48 },
  typeLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: fonts.serifBold,
    fontSize: 31,
    lineHeight: 37,
    marginTop: spacing.md,
  },
  byline: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 22, marginTop: spacing.lg },
  published: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, marginTop: spacing.xs },
  eventBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
  },
  bodyBlock: { marginTop: spacing.xl },
  body: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 27 },
  sectionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  detailRow: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.sm },
  detailLabel: { flex: 0.38, fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  detailValue: { flex: 0.62, fontFamily: fonts.regular, fontSize: 15, lineHeight: 21 },
  linkButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    alignSelf: 'flex-start',
    marginTop: spacing.xl - spacing.xs,
    paddingHorizontal: spacing.lg - 2,
  },
  linkButtonText: { fontFamily: fonts.semibold, fontSize: 15 },
  details: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 36, paddingTop: spacing.lg },
});
