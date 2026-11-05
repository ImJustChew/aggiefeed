import { fireEvent, render } from '@testing-library/react-native';

import { locationsFixture } from '@/domain/fixtures/locations.fixture';
import { parseLocations } from '@/domain/parseLocations';

import { LocationMap } from '../LocationMap';

const directory = parseLocations(locationsFixture);

describe('LocationMap', () => {
  it('updates visible markers while panning without waiting for region change complete', async () => {
    const location = directory.places[0];
    if (location === undefined) throw new Error('Fixture is invalid.');
    const panTarget = {
      ...location,
      id: 'poi:pan-target',
      name: 'Pan target',
      coordinates: { lat: 38.54, lng: -121.7 },
    };
    const map = await render(
      <LocationMap
        locations={[location, panTarget]}
        mapPadding={{ bottom: 0, left: 0, right: 0, top: 0 }}
        onPressLocation={jest.fn()}
        selectedLocation={null}
      />,
    );

    expect(map.queryByLabelText('Pan target, Prospective Students')).toBeNull();
    await fireEvent(map.getByTestId('locations-map'), 'regionChange', {
      latitude: 38.54,
      longitude: -121.7,
      latitudeDelta: 0.027,
      longitudeDelta: 0.027,
    });

    expect(await map.findByLabelText('Pan target, Prospective Students')).toBeOnTheScreen();
  });
});
