import type { ReactNode } from 'react';
import { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useReducedMotion,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

interface AnimatedRevealProps {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

export function AnimatedReveal({ children, delay = 0, style }: AnimatedRevealProps) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(reducedMotion ? 1 : 0);
  const translateY = useSharedValue(reducedMotion ? 0 : 6);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    if (reducedMotion) {
      opacity.set(1);
      translateY.set(0);
      return;
    }

    const cappedDelay = Math.min(delay, 280);
    opacity.set(withDelay(cappedDelay, withTiming(1, { duration: 240 })));
    translateY.set(withDelay(cappedDelay, withTiming(0, { duration: 240 })));
  }, [delay, opacity, reducedMotion, translateY]);

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
