import Animated, {
  useReducedMotion,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

type AnimatedPressableProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
};

const ReanimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AnimatedPressable({
  onPressIn,
  onPressOut,
  style,
  ...props
}: AnimatedPressableProps) {
  const reducedMotion = useReducedMotion();
  const pressed = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - pressed.value * 0.08,
    transform: [{ scale: 1 - pressed.value * 0.02 }],
  }));

  return (
    <ReanimatedPressable
      {...props}
      style={[style, animatedStyle]}
      onPressIn={(event) => {
        onPressIn?.(event);
        pressed.set(reducedMotion ? 0 : withTiming(1, { duration: 100 }));
      }}
      onPressOut={(event) => {
        onPressOut?.(event);
        pressed.set(reducedMotion ? 0 : withSpring(0, { duration: 180, dampingRatio: 1 }));
      }}
    />
  );
}
