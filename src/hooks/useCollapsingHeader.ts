import { useCallback, useRef, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

export function getCollapseOffset(scrollY: number, range: number): number {
  'worklet';

  return interpolate(scrollY, [0, range], [0, range], Extrapolation.CLAMP);
}

export function useCollapsingHeader() {
  const scrollY = useSharedValue(0);
  const headerHeight = useSharedValue(0);
  const collapseDistance = useSharedValue(0);
  const measuredHeaderHeightRef = useRef(0);
  const measuredWordmarkRowHeightRef = useRef(0);
  const [measuredControlsHeight, setMeasuredControlsHeight] = useState(0);
  const [measuredHeaderHeight, setMeasuredHeaderHeight] = useState(0);

  const handleControlsLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height;
    if (nextHeight <= 0) return;

    setMeasuredControlsHeight(nextHeight);
  }, []);

  const handleHeaderLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const nextHeight = event.nativeEvent.layout.height;
      if (nextHeight <= 0 || measuredHeaderHeightRef.current > 0) return;

      measuredHeaderHeightRef.current = nextHeight;
      headerHeight.set(nextHeight);
      collapseDistance.set(Math.max(0, nextHeight - measuredWordmarkRowHeightRef.current));
      setMeasuredHeaderHeight(nextHeight);
    },
    [collapseDistance, headerHeight],
  );

  const handleWordmarkRowLayout = useCallback(
    (nextHeight: number) => {
      if (nextHeight <= 0 || measuredWordmarkRowHeightRef.current === nextHeight) return;

      measuredWordmarkRowHeightRef.current = nextHeight;
      if (measuredHeaderHeightRef.current > 0) {
        collapseDistance.set(Math.max(0, measuredHeaderHeightRef.current - nextHeight));
      }
    },
    [collapseDistance],
  );

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = Math.max(0, event.contentOffset.y);
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    if (headerHeight.value === 0) return {};

    const collapseRange = collapseDistance.value;
    if (collapseRange <= 0) return { height: headerHeight.value };

    const collapseOffset = getCollapseOffset(scrollY.value, collapseRange);

    return { height: headerHeight.value - collapseOffset };
  });

  const controlsAnimatedStyle = useAnimatedStyle(() => {
    if (headerHeight.value === 0) return {};

    const collapseRange = collapseDistance.value;
    if (collapseRange <= 0) return { transform: [{ translateY: 0 }] };

    const collapseOffset = getCollapseOffset(scrollY.value, collapseRange);

    return { transform: [{ translateY: -collapseOffset }] };
  });

  return {
    collapseDistance,
    controlsAnimatedStyle,
    handleControlsLayout,
    handleHeaderLayout,
    handleWordmarkRowLayout,
    headerAnimatedStyle,
    measuredControlsHeight,
    measuredHeaderHeight,
    onScroll,
    scrollY,
  };
}
