import { locationsFixture } from '@/domain/fixtures/locations.fixture';
import { InvalidLocationsError, parseLocations } from '@/domain/parseLocations';

describe('parseLocations', () => {
  it('resolves category names and parses place fields', () => {
    const directory = parseLocations(locationsFixture);

    expect(directory.places[0]).toMatchObject({
      id: 'poi:118',
      kind: 'poi',
      categoryName: 'Student & Staff Resources',
      subcategoryName: 'Prospective Students',
      coordinates: { lat: 38.541397, lng: -121.747614 },
      buildingId: 'bldg:caan-4708',
    });
    expect(directory.places[1]).toMatchObject({
      id: 'bldg:caan-3270',
      categoryName: 'Academic & Administration',
      departments: ['Student Housing'],
      tags: ['studySpot'],
    });
    expect(directory.places[3]).toMatchObject({
      id: 'poi:883',
      searchable: false,
      subcategoryName: 'Gender Inclusive Restrooms',
    });
    expect(directory.places[4]).toMatchObject({
      id: 'bldg:orchard-1271',
      name: '1271 Blue Ridge Road',
      groupName: 'Orchard Park Apartments',
      searchable: false,
    });
  });

  it('keeps places while nulling malformed, out-of-range, and zero coordinates', () => {
    const directory = parseLocations({
      ...locationsFixture,
      places: [
        ...locationsFixture.places,
        { ...locationsFixture.places[0], id: 'poi:bad-string', lat: 'bad' },
        { ...locationsFixture.places[0], id: 'poi:bad-range', lat: 91, lng: -121 },
        { ...locationsFixture.places[0], id: 'poi:bad-zero', lat: 0, lng: 0 },
        { ...locationsFixture.places[0], id: 'poi:bad-non-finite', lat: Number.NaN },
        { ...locationsFixture.places[0], id: 'poi:bad-infinity', lng: Number.POSITIVE_INFINITY },
        { ...locationsFixture.places[0], id: 'poi:bad-longitude', lng: -181 },
      ],
    });

    expect(directory.places.slice(-6).map((place) => place.coordinates)).toEqual([
      null,
      null,
      null,
      null,
      null,
      null,
    ]);
  });

  it('hides duplicate searchable places with the same CAAN and name', () => {
    const directory = parseLocations({
      ...locationsFixture,
      places: [
        {
          id: 'bldg:caan-3331-232',
          kind: 'building',
          name: ' Hickey Gym ',
          categoryId: 'academic-administration',
          lat: 38.54,
          lng: -121.75,
          caan: '3331',
          searchable: true,
        },
        {
          id: 'bldg:caan-3331',
          kind: 'building',
          name: 'Hickey Gym',
          categoryId: 'academic-administration',
          lat: 38.54,
          lng: -121.75,
          caan: '3331',
          searchable: true,
        },
      ],
    });

    expect(directory.places.map(({ id, searchable }) => ({ id, searchable }))).toEqual([
      { id: 'bldg:caan-3331-232', searchable: false },
      { id: 'bldg:caan-3331', searchable: true },
    ]);
  });

  it('hides nearby duplicate names without a CAAN and keeps farther places searchable', () => {
    const directory = parseLocations({
      ...locationsFixture,
      places: [
        {
          id: 'poi:long-id',
          kind: 'poi',
          name: 'Dining Commons',
          categoryId: 'academic-administration',
          lat: 38.54,
          lng: -121.7,
          searchable: true,
        },
        {
          id: 'poi:x',
          kind: 'poi',
          name: ' dining commons ',
          categoryId: 'academic-administration',
          lat: 38.54,
          lng: -121.699,
          searchable: true,
        },
        {
          id: 'poi:farther',
          kind: 'poi',
          name: 'Dining Commons',
          categoryId: 'academic-administration',
          lat: 38.54,
          lng: -121.697,
          searchable: true,
        },
      ],
    });

    expect(directory.places.map(({ id, searchable }) => ({ id, searchable }))).toEqual([
      { id: 'poi:long-id', searchable: false },
      { id: 'poi:x', searchable: true },
      { id: 'poi:farther', searchable: true },
    ]);
  });

  it('collapses nearby POI and building matches while keeping farther parking lots distinct', () => {
    const directory = parseLocations({
      ...locationsFixture,
      places: [
        {
          id: 'poi:11',
          kind: 'poi',
          name: 'Cuarto Dining Commons',
          categoryId: 'dining',
          lat: 38.5414,
          lng: -121.7476,
          searchable: true,
        },
        {
          id: 'bldg:caan-9526',
          kind: 'building',
          name: 'Cuarto Dining Commons',
          categoryId: 'dining',
          lat: 38.5414,
          lng: -121.74751,
          caan: '9526',
          searchable: true,
        },
        {
          id: 'parking:31',
          kind: 'parking',
          name: 'Lot 1',
          categoryId: 'parking',
          lat: 38.54,
          lng: -121.75,
          searchable: true,
        },
        {
          id: 'parking:32',
          kind: 'parking',
          name: 'Lot 1',
          categoryId: 'parking',
          lat: 38.54,
          lng: -121.7478,
          searchable: true,
        },
      ],
    });

    expect(directory.places.map(({ id, searchable }) => ({ id, searchable }))).toEqual([
      { id: 'poi:11', searchable: false },
      { id: 'bldg:caan-9526', searchable: true },
      { id: 'parking:31', searchable: true },
      { id: 'parking:32', searchable: true },
    ]);
  });

  it('drops entries without the required identity fields and tolerates malformed optional fields', () => {
    const directory = parseLocations({
      ...locationsFixture,
      places: [
        ...locationsFixture.places,
        { id: 'missing-kind', name: 'Missing kind', categoryId: 'student-staff-resources' },
        {
          id: 'poi:mistyped',
          kind: 'poi',
          name: '  Mistyped  ',
          categoryId: 'unknown-category',
          lat: 38,
          lng: -121,
          searchable: true,
          departments: [' Department ', 42],
          url: 'javascript:alert(1)',
        },
      ],
    });

    expect(directory.places).toHaveLength(6);
    expect(directory.places.at(-1)).toMatchObject({
      id: 'poi:mistyped',
      name: 'Mistyped',
      categoryName: null,
      subcategoryName: null,
      departments: ['Department'],
      url: null,
    });
  });

  it('rejects a response without the required directory arrays', () => {
    expect(() => parseLocations({ places: [] })).toThrow(InvalidLocationsError);
    expect(() => parseLocations([])).toThrow(InvalidLocationsError);
  });
});
