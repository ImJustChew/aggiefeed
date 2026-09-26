import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useReducedMotion,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/theme';

export function LoadingSkeleton() {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(reducedMotion ? 0.7 : 0.45);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  useEffect(() => {
    if (!reducedMotion) {
      opacity.set(
        withRepeat(
          withSequence(withTiming(0.8, { duration: 360 }), withTiming(0.45, { duration: 360 })),
          -1,
          true,
        ),
      );
    }
  }, [opacity, reducedMotion]);

  return (
    <View style={styles.container} accessible accessibilityLabel="Loading stories">
      {[0, 1, 2].map((item) => (
        <Animated.View key={item} style={[styles.item, animatedStyle]}>
          <View style={[styles.kicker, { backgroundColor: theme.colors.hairline }]} />
          <View style={[styles.title, { backgroundColor: theme.colors.hairline }]} />
          <View style={[styles.summary, { backgroundColor: theme.colors.hairline }]} />
          <View style={[styles.summaryShort, { backgroundColor: theme.colors.hairline }]} />
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 1 },
  item: { paddingVertical: 24, gap: 10 },
  kicker: { width: '42%', height: 10, borderRadius: 2 },
  title: { width: '88%', height: 20, borderRadius: 2 },
  summary: { width: '96%', height: 12, borderRadius: 2, marginTop: 2 },
  summaryShort: { width: '72%', height: 12, borderRadius: 2 },
});
