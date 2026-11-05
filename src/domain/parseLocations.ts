import type { ApiLocation, ApiLocationCategory } from '@/api/types';

import type {
  Location,
  LocationCategory,
  LocationCoordinates,
  LocationDirectory,
  LocationKind,
  LocationSubcategory,
} from './location';
import { cleanText } from './text';
import { parseHttpUrl } from './url';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonBlankString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? cleanText(value) : null;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    const string = nonBlankString(item);
    return string === null ? [] : [string];
  });
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function toCoordinates(lat: unknown, lng: unknown): LocationCoordinates | null {
  const latitude = finiteNumber(lat);
  const longitude = finiteNumber(lng);

  if (
    latitude === null ||
    longitude === null ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180 ||
    (latitude === 0 && longitude === 0)
  ) {
    return null;
  }

  return { lat: latitude, lng: longitude };
}

function toKind(value: unknown): LocationKind | null {
  return value === 'building' || value === 'poi' || value === 'parking' ? value : null;
}

function parseSubcategory(raw: unknown): LocationSubcategory | null {
  if (!isRecord(raw)) return null;

  const id = nonBlankString(raw.id);
  const name = nonBlankString(raw.name);
  return id === null || name === null ? null : { id, name };
}

function parseCategory(raw: unknown): LocationCategory | null {
  if (!isRecord(raw)) return null;

  const id = nonBlankString(raw.id);
  const name = nonBlankString(raw.name);
  if (id === null || name === null) return null;

  const subcategories = Array.isArray(raw.subcategories)
    ? raw.subcategories.flatMap((subcategory) => {
        const parsed = parseSubcategory(subcategory);
        return parsed === null ? [] : [parsed];
      })
    : [];

  return { id, name, subcategories };
}

function categoryMaps(categories: LocationCategory[]): {
  names: Map<string, string>;
  subcategoryNames: Map<string, Map<string, string>>;
} {
  const names = new Map<string, string>();
  const subcategoryNames = new Map<string, Map<string, string>>();

  for (const category of categories) {
    names.set(category.id, category.name);
    subcategoryNames.set(
      category.id,
      new Map(category.subcategories.map((subcategory) => [subcategory.id, subcategory.name])),
    );
  }

  return { names, subcategoryNames };
}

function parsePlace(
  raw: unknown,
  categoryNames: Map<string, string>,
  subcategoryNames: Map<string, Map<string, string>>,
): Location | null {
  if (!isRecord(raw)) return null;

  const id = nonBlankString(raw.id);
  const kind = toKind(raw.kind);
  const name = nonBlankString(raw.name);
  const categoryId = nonBlankString(raw.categoryId);
  if (id === null || kind === null || name === null || categoryId === null) return null;

  const subcategoryId = nonBlankString(raw.subcategoryId);
  const subcategoryMap = subcategoryNames.get(categoryId);

  return {
    id,
    kind,
    name,
    categoryId,
    categoryName: categoryNames.get(categoryId) ?? null,
    subcategoryId,
    subcategoryName: subcategoryId === null ? null : (subcategoryMap?.get(subcategoryId) ?? null),
    coordinates: toCoordinates(raw.lat, raw.lng),
    // Keep searchable:false places in the directory so stable-id deep links can still resolve;
    // the locations UI filters them from its list and map unless one is explicitly selected.
    searchable: raw.searchable === true,
    groupName: nonBlankString(raw.groupName),
    campus: nonBlankString(raw.campus),
    description: nonBlankString(raw.description),
    url: parseHttpUrl(nonBlankString(raw.url)),
    imageUrl: parseHttpUrl(nonBlankString(raw.imageUrl)),
    buildingId: nonBlankString(raw.buildingId),
    caan: nonBlankString(raw.caan),
    departments: stringArray(raw.departments),
    permits: stringArray(raw.permits),
    aliases: stringArray(raw.aliases),
    tags: stringArray(raw.tags),
  };
}

function distanceInMeters(left: LocationCoordinates, right: LocationCoordinates): number {
  const radians = Math.PI / 180;
  const latitudeDelta = (right.lat - left.lat) * radians;
  const longitudeDelta = (right.lng - left.lng) * radians;
  const latitude = left.lat * radians;
  const otherLatitude = right.lat * radians;
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitude) * Math.cos(otherLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 6_371_000 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function normalizedPlaceName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function duplicateMetadataCount(place: Location): number {
  return (
    Number(place.imageUrl !== null) +
    Number(place.description !== null) +
    Number(place.url !== null)
  );
}

function compareDuplicatePreference(left: Location, right: Location): number {
  if (left.caan !== null && right.caan === null) return -1;
  if (left.caan === null && right.caan !== null) return 1;

  const metadataDifference = duplicateMetadataCount(right) - duplicateMetadataCount(left);
  return metadataDifference || left.id.length - right.id.length || left.id.localeCompare(right.id);
}

function areDuplicatePlaces(left: Location, right: Location): boolean {
  if (left.caan !== null && right.caan !== null) {
    return left.caan === right.caan;
  }

  return (
    left.coordinates !== null &&
    right.coordinates !== null &&
    distanceInMeters(left.coordinates, right.coordinates) <= 150
  );
}

function hideDuplicateSearchResults(places: Location[]): Location[] {
  const byNameAndCategory = new Map<string, Location[]>();
  for (const place of places) {
    if (!place.searchable) continue;
    const key = `${place.categoryId}\u0000${normalizedPlaceName(place.name)}`;
    const group = byNameAndCategory.get(key) ?? [];
    group.push(place);
    byNameAndCategory.set(key, group);
  }

  const duplicates = new Set<Location>();
  for (const group of byNameAndCategory.values()) {
    const representatives: Location[] = [];
    const preferredFirst = [...group].sort(compareDuplicatePreference);

    for (const place of preferredFirst) {
      const duplicate = representatives.some((representative) =>
        areDuplicatePlaces(place, representative),
      );

      if (duplicate) duplicates.add(place);
      else representatives.push(place);
    }
  }

  return places.map((place) => (duplicates.has(place) ? { ...place, searchable: false } : place));
}

export class InvalidLocationsError extends Error {
  constructor() {
    super('The locations response was not in the expected format.');
    this.name = 'InvalidLocationsError';
  }
}

/** Validates the directory envelope and maps only valid place and category entries. */
export function parseLocations(payload: unknown): LocationDirectory {
  if (!isRecord(payload) || !Array.isArray(payload.categories) || !Array.isArray(payload.places)) {
    throw new InvalidLocationsError();
  }

  const categories = payload.categories.flatMap((category) => {
    const parsed = parseCategory(category as ApiLocationCategory);
    return parsed === null ? [] : [parsed];
  });
  const maps = categoryMaps(categories);
  const places = payload.places.flatMap((place) => {
    const parsed = parsePlace(place as ApiLocation, maps.names, maps.subcategoryNames);
    return parsed === null ? [] : [parsed];
  });
  const uniqueSearchPlaces = hideDuplicateSearchResults(places);

  return {
    categories,
    places: uniqueSearchPlaces,
  };
}
