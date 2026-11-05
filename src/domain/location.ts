export type LocationKind = 'building' | 'poi' | 'parking';

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface LocationSubcategory {
  id: string;
  name: string;
}

export interface LocationCategory {
  id: string;
  name: string;
  subcategories: LocationSubcategory[];
}

export interface Location {
  id: string;
  kind: LocationKind;
  name: string;
  categoryId: string;
  categoryName: string | null;
  subcategoryId: string | null;
  subcategoryName: string | null;
  coordinates: LocationCoordinates | null;
  searchable: boolean;
  groupName: string | null;
  campus: string | null;
  description: string | null;
  url: string | null;
  imageUrl: string | null;
  buildingId: string | null;
  caan: string | null;
  departments: string[];
  permits: string[];
  aliases: string[];
  tags: string[];
}

export interface LocationDirectory {
  categories: LocationCategory[];
  places: Location[];
}

const STREET_SUFFIX_PATTERN =
  /\b(?:alley|aly|avenue|ave|boulevard|blvd|circle|cir|court|ct|drive|dr|expressway|expy|freeway|fwy|highway|hwy|lane|ln|loop|parkway|pkwy|place|pl|road|rd|route|rte|square|sq|street|st|terrace|ter|trail|trl|turnpike|tpke|way)\.?$/i;

function isStreetAddressName(name: string): boolean {
  const normalizedName = name.trim();
  return /^\d+\s/.test(normalizedName) || STREET_SUFFIX_PATTERN.test(normalizedName);
}

function categoryLabel(location: Location): string {
  return location.subcategoryName ?? location.categoryName ?? location.kind;
}

function hasGroupName(location: Location): location is Location & { groupName: string } {
  return location.groupName !== null && location.groupName.trim().length > 0;
}

/** Returns the user-facing title, collapsing address-like units into their group. */
export function locationDisplayName(location: Location): string {
  if (hasGroupName(location) && isStreetAddressName(location.name)) {
    return location.groupName;
  }

  return location.name;
}

/** Returns the user-facing subtitle for a location title. */
export function locationSubtitle(location: Location): string {
  if (hasGroupName(location) && isStreetAddressName(location.name)) {
    return location.name;
  }

  const title = locationDisplayName(location);
  const category = categoryLabel(location);
  if (
    hasGroupName(location) &&
    normalizeForSearch(location.groupName) !== normalizeForSearch(title)
  ) {
    return category + ' · ' + location.groupName;
  }

  return category;
}

function normalizeForSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function searchFields(place: Location): string[] {
  return [
    place.name,
    locationDisplayName(place),
    place.id,
    place.kind,
    place.categoryName,
    place.subcategoryName,
    place.groupName,
    place.campus,
    place.description,
    place.buildingId,
    place.caan,
    ...place.departments,
    ...place.permits,
    ...place.aliases,
    ...place.tags,
  ].filter((field): field is string => field !== null);
}

function searchRank(place: Location, query: string, queryTokens: string[]): number {
  const name = normalizeForSearch(locationDisplayName(place));
  if (name === query) return 0;
  if (name.startsWith(query)) return 1;
  if (name.includes(query)) return 2;

  const searchableText = normalizeForSearch(searchFields(place).join(' '));
  return queryTokens.every((token) => searchableText.includes(token)) ? 3 : 4;
}

/** Returns categories that have at least one searchable place with map coordinates. */
export function visibleLocationCategories(
  categories: LocationCategory[],
  locations: Location[],
): LocationCategory[] {
  const visibleCategoryIds = new Set(
    locations
      .filter((location) => location.searchable && location.coordinates !== null)
      .map((location) => location.categoryId),
  );

  return categories.filter((category) => visibleCategoryIds.has(category.id));
}

/** Applies the directory's visibility, text search, and optional category filters. */
export function filterLocations(
  locations: Location[],
  query: string,
  categoryId: string | null = null,
): Location[] {
  return searchLocations(
    locations.filter((location) => location.searchable),
    query,
  ).filter((location) => categoryId === null || location.categoryId === categoryId);
}

/** Searches the supplied locations, including entries hidden from the UI. */
export function searchLocations(locations: Location[], query: string): Location[] {
  const normalizedQuery = normalizeForSearch(query.trim());
  if (normalizedQuery.length === 0) {
    return [...locations].sort((left, right) => {
      const nameOrder = normalizeForSearch(locationDisplayName(left)).localeCompare(
        normalizeForSearch(locationDisplayName(right)),
      );
      return nameOrder || left.id.localeCompare(right.id);
    });
  }

  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
  return locations
    .filter((place) => {
      const searchableText = normalizeForSearch(searchFields(place).join(' '));
      return queryTokens.every((token) => searchableText.includes(token));
    })
    .sort((left, right) => {
      const rankOrder =
        searchRank(left, normalizedQuery, queryTokens) -
        searchRank(right, normalizedQuery, queryTokens);
      if (rankOrder !== 0) return rankOrder;

      const nameOrder = normalizeForSearch(locationDisplayName(left)).localeCompare(
        normalizeForSearch(locationDisplayName(right)),
      );
      return nameOrder || left.id.localeCompare(right.id);
    });
}
