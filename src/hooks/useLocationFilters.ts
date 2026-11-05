import { useCallback, useMemo, useState } from 'react';

import {
  filterLocations,
  visibleLocationCategories,
  type Location,
  type LocationCategory,
} from '@/domain/location';

export function useLocationFilters(
  locations: Location[],
  categories: LocationCategory[],
  initialSelectedId?: string,
) {
  const [query, setQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    () => initialSelectedId?.trim() || null,
  );

  const locationById = useMemo(
    () => new Map(locations.map((location) => [location.id, location])),
    [locations],
  );
  const filteredLocations = useMemo(
    () => filterLocations(locations, query, selectedCategoryId),
    [locations, query, selectedCategoryId],
  );
  const visibleCategories = useMemo(
    () => visibleLocationCategories(categories, locations),
    [categories, locations],
  );
  const selectedLocation = selectedLocationId
    ? (locationById.get(selectedLocationId) ?? null)
    : null;

  const updateQuery = useCallback(
    (nextQuery: string) => {
      setQuery(nextQuery);
      if (selectedLocationId === null) return;

      const selected = locationById.get(selectedLocationId);
      if (
        selected === undefined ||
        filterLocations([selected], nextQuery, selectedCategoryId).length === 0
      ) {
        setSelectedLocationId(null);
      }
    },
    [locationById, selectedCategoryId, selectedLocationId],
  );

  const selectCategory = useCallback(
    (categoryId: string | null) => {
      setSelectedCategoryId(categoryId === selectedCategoryId ? null : categoryId);
      setSelectedLocationId(null);
    },
    [selectedCategoryId],
  );

  const clearSelection = useCallback(() => setSelectedLocationId(null), []);

  return {
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
  };
}
