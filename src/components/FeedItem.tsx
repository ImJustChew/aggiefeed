import { memo, useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Activity } from '@/domain/activity';
import { fonts, spacing, useTheme } from '@/theme';
import {
  displayEventStart,
  displayActivityType,
  displayRelativePublished,
  displaySource,
  displayTitle,
  isEvent,
} from '@/ui/activityPresentation';

import { AnimatedPressable } from './AnimatedPressable';
import { AnimatedReveal } from './AnimatedReveal';

interface FeedItemProps {
  activity: Activity;
  index: number;
  onPress: (id: string) => void;
}

export const FeedItem = memo(function FeedItem({ activity, index, onPress }: FeedItemProps) {
  const theme = useTheme();
  const title = displayTitle(activity);
  const source = displaySource(activity);
  const event = isEvent(activity);
  const handlePress = useCallback(() => onPress(activity.id), [activity.id, onPress]);

  return (
    <AnimatedReveal delay={Math.min(index, 7) * 36}>
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${source}`}
        accessibilityHint="Opens the full activity"
        onPress={handlePress}
        style={styles.pressable}
      >
        <View style={styles.kickerRow}>
          <Text style={[styles.kicker, { color: theme.colors.textSecondary }]}>
            {source} · {displayRelativePublished(activity.published)}
          </Text>
        </View>
        <Text
          style={[styles.title, { color: theme.colors.text }]}
          numberOfLines={3}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
        {activity.summary !== null ? (
          <Text
            style={[styles.summary, { color: theme.colors.textSecondary }]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {activity.summary}
          </Text>
        ) : null}
        {event ? (
          <Text style={[styles.eventLabel, { color: theme.colors.highlight }]}>
            {displayActivityType(activity)} · {displayEventStart(activity)}
          </Text>
        ) : null}
      </AnimatedPressable>
    </AnimatedReveal>
  );
});

const styles = StyleSheet.create({
  pressable: { minHeight: 44, paddingVertical: spacing.lg },
  kickerRow: { minHeight: 18, justifyContent: 'center' },
  kicker: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 18 },
  eventLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.sm - 2,
  },
  title: {
    fontFamily: fonts.serifSemibold,
    fontSize: 21,
    lineHeight: 27,
    marginTop: spacing.sm,
  },
  summary: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, marginTop: spacing.sm },
});
