import { useCallback, useMemo, useState } from 'react';
import { useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { EdgePadding } from 'react-native-maps';

import { MAP_PADDING_TOP_OFFSET } from '@/components/locations/layout';

const SHEET_SNAP_FRACTIONS = [0.22, 0.52, 0.92] as const;
const SHEET_SNAP_POINTS = ['22%', '52%', '92%'];
export const INITIAL_SHEET_SNAP_INDEX = 1;

export function useMapSheetInsets() {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [containerHeight, setContainerHeight] = useState(windowHeight);
  const [sheetIndex, setSheetIndex] = useState(INITIAL_SHEET_SNAP_INDEX);

  const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerHeight(event.nativeEvent.layout.height);
  }, []);
  const handleSheetChange = useCallback((index: number) => setSheetIndex(index), []);
  const snapPoints = SHEET_SNAP_POINTS;
  const mapPadding = useMemo<EdgePadding>(
    () => ({
      top: insets.top + MAP_PADDING_TOP_OFFSET,
      right: 0,
      bottom: containerHeight * (SHEET_SNAP_FRACTIONS[sheetIndex] ?? 0.52),
      left: 0,
    }),
    [containerHeight, insets.top, sheetIndex],
  );

  return {
    bottomInset: insets.bottom,
    handleContainerLayout,
    handleSheetChange,
    mapPadding,
    setSnapIndex: setSheetIndex,
    sheetSnapIndex: sheetIndex,
    snapPoints,
    topInset: insets.top,
  };
}
