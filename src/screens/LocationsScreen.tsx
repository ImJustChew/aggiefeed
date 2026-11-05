import type BottomSheet from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';

import type { Location, LocationCategory } from '@/domain/location';
import { useTheme } from '@/theme';

import {
  LocationMap,
  regionForCoordinates,
  regionForLocation,
  type LocationMapHandle,
} from '@/components/locations/LocationMap';
import { LocationsSheet } from '@/components/locations/LocationsSheet';
import { MapBackButton } from '@/components/locations/MapBackButton';
import { MapSearchControls } from '@/components/locations/MapSearchControls';
import { MapStatusPill } from '@/components/locations/MapStatusPill';
import { MapTopScrim } from '@/components/locations/MapTopScrim';
import { INITIAL_SHEET_SNAP_INDEX, useMapSheetInsets } from '@/hooks/useMapSheetInsets';
import { useLocationFilters } from '@/hooks/useLocationFilters';

export type LocationsDirectoryState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; locations: Location[]; categories: LocationCategory[] };

interface LocationsScreenProps {
  state: LocationsDirectoryState;
  initialSelectedId?: string;
  onRetry: () => void;
  onBack: () => void;
}

const EMPTY_LOCATIONS: Location[] = [];
const EMPTY_CATEGORIES: LocationCategory[] = [];

export function LocationsScreen({
  state,
  initialSelectedId,
  onRetry,
  onBack,
}: LocationsScreenProps) {
  const theme = useTheme();
  const mapRef = useRef<LocationMapHandle | null>(null);
  const sheetRef = useRef<BottomSheet | null>(null);
  const handledDeepLinkIdRef = useRef<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const {
    bottomInset,
    handleContainerLayout,
    handleSheetChange,
    mapPadding,
    setSnapIndex,
    sheetSnapIndex,
    snapPoints,
    topInset,
  } = useMapSheetInsets();
  const snapToIndex = useCallback(
    (index: number) => {
      setSnapIndex(index);
      sheetRef.current?.snapToIndex(index);
    },
    [setSnapIndex],
  );
  const locations = state.status === 'ready' ? state.locations : EMPTY_LOCATIONS;
  const categories = state.status === 'ready' ? state.categories : EMPTY_CATEGORIES;
  const {
    clearSelection,
    filteredLocations,
    locationById,
    query,
    selectedCategoryId,
    selectedLocation,
    selectCategory,
    setSelectedLocationId,
    updateQuery,
    visibleCategories,
  } = useLocationFilters(locations, categories, initialSelectedId);
  const mapCoordinates = useMemo(
    () =>
      filteredLocations.flatMap((location) =>
        location.coordinates === null ? [] : [location.coordinates],
      ),
    [filteredLocations],
  );
  const handleMapReady = useCallback(() => setMapReady(true), []);

  const focusLocation = useCallback(
    (location: Location) => {
      const region = regionForLocation(location);
      if (region === null) return;

      Keyboard.dismiss();
      const alreadyFocused = selectedLocation?.id === location.id && sheetSnapIndex === 0;
      setSelectedLocationId(location.id);
      snapToIndex(0);
      if (alreadyFocused) mapRef.current?.animateToRegion(region, 350);
    },
    [selectedLocation?.id, setSelectedLocationId, sheetSnapIndex, snapToIndex],
  );

  useEffect(() => {
    if (selectedLocation === null || sheetSnapIndex !== 0) return;
    const region = regionForLocation(selectedLocation);
    if (region !== null) mapRef.current?.animateToRegion(region, 350);
  }, [selectedLocation, sheetSnapIndex]);

  useEffect(() => {
    if (!mapReady || state.status !== 'ready' || mapCoordinates.length === 0) return;
    if (mapCoordinates.length === 1) {
      const [coordinates] = mapCoordinates;
      const region = regionForCoordinates(coordinates ?? null);
      if (region !== null) {
        mapRef.current?.animateToRegion(region, 350);
      }
    } else {
      mapRef.current?.fitToCoordinates(mapCoordinates);
    }
  }, [mapCoordinates, mapReady, state.status]);

  useEffect(() => {
    const id = initialSelectedId?.trim() ?? '';
    if (state.status !== 'ready' || id.length === 0 || handledDeepLinkIdRef.current === id) return;

    const location = locationById.get(id);
    if (location === undefined || location.coordinates === null) return;
    handledDeepLinkIdRef.current = id;
    focusLocation(location);
  }, [focusLocation, initialSelectedId, locationById, state.status]);

  const selectLocation = useCallback(
    (id: string) => {
      const location = locationById.get(id);
      if (location !== undefined) focusLocation(location);
    },
    [focusLocation, locationById],
  );
  const handleSelectCategory = useCallback(
    (categoryId: string | null) => {
      selectCategory(categoryId);
      snapToIndex(1);
      Keyboard.dismiss();
    },
    [selectCategory, snapToIndex],
  );
  const handleClearSelection = useCallback(() => {
    clearSelection();
    snapToIndex(1);
  }, [clearSelection, snapToIndex]);

  return (
    <View
      onLayout={handleContainerLayout}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <LocationMap
        locations={filteredLocations}
        mapPadding={mapPadding}
        onMapReady={handleMapReady}
        onPressLocation={selectLocation}
        ref={mapRef}
        selectedLocation={selectedLocation}
      />
      <MapTopScrim color={theme.colors.background} topInset={topInset} />
      <MapBackButton onPress={onBack} topInset={topInset} />
      <MapSearchControls
        categories={visibleCategories}
        onChangeQuery={updateQuery}
        onSelectCategory={handleSelectCategory}
        query={query}
        selectedCategoryId={selectedCategoryId}
        topInset={topInset}
      />
      {state.status === 'loading' ? (
        <MapStatusPill kind="loading" topInset={topInset} />
      ) : state.status === 'error' ? (
        <MapStatusPill kind="error" onRetry={onRetry} topInset={topInset} />
      ) : null}
      <LocationsSheet
        bottomInset={bottomInset}
        errorMessage={state.status === 'error' ? state.message : undefined}
        locations={filteredLocations}
        onClearSelection={handleClearSelection}
        onPressLocation={selectLocation}
        onRetry={onRetry}
        onSheetChange={handleSheetChange}
        query={query}
        selectedLocation={selectedLocation}
        sheetIndex={INITIAL_SHEET_SNAP_INDEX}
        sheetRef={sheetRef}
        snapPoints={snapPoints}
        status={state.status}
      />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
