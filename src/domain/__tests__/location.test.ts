import { locationsFixture } from '@/domain/fixtures/locations.fixture';
import {
  filterLocations,
  locationDisplayName,
  locationSubtitle,
  searchLocations,
  visibleLocationCategories,
} from '@/domain/location';
import { parseLocations } from '@/domain/parseLocations';

describe('searchLocations', () => {
  const locations = parseLocations(locationsFixture).places;

  it('matches names case-insensitively and ignores diacritics', () => {
    const firstLocation = locations[0];
    if (firstLocation === undefined) throw new Error('Fixture is empty.');
    const accentedLocation = { ...firstLocation, id: 'poi:cafe', name: 'Café Commons' };

    expect(searchLocations([accentedLocation], 'CAFE')).toEqual([accentedLocation]);
    expect(searchLocations(locations, 'FINANCIAL AID').map(({ id }) => id)).toEqual(['poi:118']);
  });

  it('matches category metadata, building ids, departments, tags, and permits', () => {
    expect(searchLocations(locations, 'gender restroom').map(({ id }) => id)).toEqual(['poi:883']);
    expect(searchLocations(locations, 'student housing').map(({ id }) => id)).toContain(
      'bldg:caan-3270',
    );
    expect(searchLocations(locations, 'study spot').map(({ id }) => id)).toEqual([
      'bldg:caan-3270',
    ]);
    expect(searchLocations(locations, 'visitor parking').map(({ id }) => id)).toEqual([
      'parking:30',
    ]);
    expect(searchLocations(locations, '4799').map(({ id }) => id)).toEqual(['poi:883']);
  });

  it('keeps searchable:false places available to direct searches while filters hide them', () => {
    expect(searchLocations(locations, 'restroom')[0]?.searchable).toBe(false);
    expect(filterLocations(locations, 'restroom')).toEqual([]);
    expect(searchLocations(locations, '').map(locationDisplayName)).toEqual([
      'Financial Aid and Scholarships',
      'Gateway Parking Structure',
      'Gender-Inclusive Restroom',
      'Orchard Park Apartments',
      'Silo',
    ]);
  });

  it('uses a group for address-like names and adds group context to other subtitles', () => {
    const address = locations.find((location) => location.id === 'bldg:orchard-1271');
    if (address === undefined) throw new Error('Address fixture is missing.');

    expect(locationDisplayName(address)).toBe('Orchard Park Apartments');
    expect(locationSubtitle(address)).toBe('1271 Blue Ridge Road');
    expect(locationDisplayName({ ...address, name: 'Blue Ridge Road' })).toBe(
      'Orchard Park Apartments',
    );
    expect(locationSubtitle({ ...address, name: 'Blue Ridge Road' })).toBe('Blue Ridge Road');

    const groupedPlace = locations[0];
    if (groupedPlace === undefined) throw new Error('Fixture is empty.');
    const grouped = { ...groupedPlace, groupName: 'Student Services Center' };
    expect(locationDisplayName(grouped)).toBe(grouped.name);
    expect(locationSubtitle(grouped)).toBe('Prospective Students · Student Services Center');
  });
});

describe('location filters', () => {
  const directory = parseLocations(locationsFixture);

  it('combines the category filter with searchable text results', () => {
    expect(
      filterLocations(directory.places, 'visitor', 'transportation-parking').map(({ id }) => id),
    ).toEqual(['parking:30']);
    expect(filterLocations(directory.places, 'visitor', 'academic-administration')).toEqual([]);
    expect(
      filterLocations(directory.places, '', 'student-staff-resources').map(({ id }) => id),
    ).toEqual(['poi:118']);
  });

  it('shows only categories with searchable, located places', () => {
    const hiddenCategory = {
      id: 'hidden-category',
      name: 'Hidden Category',
      subcategories: [],
    };
    const unlocatedCategory = {
      id: 'unlocated-category',
      name: 'Unlocated Category',
      subcategories: [],
    };
    const source = directory.places[0];
    if (source === undefined) throw new Error('Fixture is empty.');

    const places = [
      ...directory.places,
      {
        ...source,
        id: 'hidden:place',
        categoryId: hiddenCategory.id,
        searchable: false,
      },
      {
        ...source,
        id: 'unlocated:place',
        categoryId: unlocatedCategory.id,
        coordinates: null,
      },
    ];

    expect(
      visibleLocationCategories(
        [...directory.categories, hiddenCategory, unlocatedCategory],
        places,
      ).map(({ id }) => id),
    ).toEqual(['student-staff-resources', 'transportation-parking', 'academic-administration']);
  });
});
