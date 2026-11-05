import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useCallback, type RefObject } from 'react';
import { StyleSheet, type ListRenderItem } from 'react-native';

import type { Location } from '@/domain/location';
import { spacing, useTheme } from '@/theme';

import { LocationRow } from './LocationRow';
import { LocationsListEmptyState } from './LocationsListEmptyState';
import { SelectedLocationCard } from './SelectedLocationCard';

interface LocationsSheetProps {
  bottomInset: number;
  errorMessage?: string;
  locations: Location[];
  onClearSelection: () => void;
  onPressLocation: (id: string) => void;
  onRetry: () => void;
  onSheetChange: (index: number) => void;
  query: string;
  selectedLocation: Location | null;
  sheetIndex: number;
  sheetRef: RefObject<BottomSheet | null>;
  snapPoints: string[];
  status: 'loading' | 'error' | 'ready';
}

export function LocationsSheet({
  bottomInset,
  errorMessage,
  locations,
  onClearSelection,
  onPressLocation,
  onRetry,
  onSheetChange,
  query,
  selectedLocation,
  sheetIndex,
  sheetRef,
  snapPoints,
  status,
}: LocationsSheetProps) {
  const theme = useTheme();
  const renderItem = useCallback<ListRenderItem<Location>>(
    ({ item }) => <LocationRow location={item} onPress={onPressLocation} />,
    [onPressLocation],
  );

  return (
    <BottomSheet
      accessibilityLabel="Campus locations drawer"
      backgroundStyle={[styles.background, { backgroundColor: theme.colors.background }]}
      enablePanDownToClose={false}
      handleIndicatorStyle={{ backgroundColor: theme.colors.textTertiary }}
      index={sheetIndex}
      onChange={onSheetChange}
      ref={sheetRef}
      snapPoints={snapPoints}
    >
      <BottomSheetFlatList
        accessibilityLabel="Campus locations"
        contentContainerStyle={[
          styles.listContent,
          locations.length === 0 && styles.emptyList,
          { paddingBottom: bottomInset + spacing.xl },
        ]}
        data={locations}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <LocationsListEmptyState
            errorMessage={errorMessage}
            onRetry={onRetry}
            query={query}
            status={status}
          />
        }
        ListHeaderComponent={
          selectedLocation ? (
            <SelectedLocationCard location={selectedLocation} onClear={onClearSelection} />
          ) : null
        }
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        renderItem={renderItem}
        testID="locations-list"
        windowSize={11}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  background: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { height: -2, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
  },
  listContent: { paddingBottom: spacing.xl, paddingTop: spacing.md },
  emptyList: { flexGrow: 1 },
});
