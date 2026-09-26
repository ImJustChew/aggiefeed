import { StyleSheet, Text, View } from 'react-native';

import { fonts, spacing, useTheme } from '@/theme';
import { formatFeedDate } from '@/ui/activityPresentation';

import { AnimatedReveal } from './AnimatedReveal';

interface FeedHeaderProps {
  date?: Date;
}

export function FeedHeader({ date = new Date() }: FeedHeaderProps) {
  const theme = useTheme();

  return (
    <AnimatedReveal style={styles.container}>
      <View>
        <Text style={[styles.date, { color: theme.colors.textTertiary }]}>
          {formatFeedDate(date)}
        </Text>
        <Text style={[styles.title, { color: theme.colors.text }]}>AggieFeed</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Campus news and events, in one calm read.
        </Text>
      </View>
    </AnimatedReveal>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: spacing.lg, paddingBottom: spacing.xl },
  date: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1.1 },
  title: {
    fontFamily: fonts.serifSemibold,
    fontSize: 40,
    lineHeight: 46,
    marginTop: spacing.sm,
  },
  subtitle: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, marginTop: spacing.sm },
});
