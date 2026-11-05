import {
  fireEvent,
  render,
  screen,
  userEvent,
  waitFor,
  within,
} from '@testing-library/react-native';
import { Children, type ReactNode } from 'react';
import { Dimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SELECTED_PIN_COLOR } from '@/components/locations/mapColors';
import { locationsFixture } from '@/domain/fixtures/locations.fixture';
import { parseLocations } from '@/domain/parseLocations';

import { LocationsScreen } from '../LocationsScreen';

const directory = parseLocations(locationsFixture);
const locations = directory.places;

const testMetrics = {
  frame: { height: 800, width: 400, x: 0, y: 0 },
  insets: { bottom: 0, left: 0, right: 0, top: 0 },
};

function TestSafeAreaProvider({ children }: { children: ReactNode }) {
  return <SafeAreaProvider initialMetrics={testMetrics}>{children}</SafeAreaProvider>;
}

async function renderLocations(
  overrides: Partial<React.ComponentProps<typeof LocationsScreen>> = {},
) {
  return render(
    <LocationsScreen
      onBack={jest.fn()}
      onRetry={jest.fn()}
      state={{ status: 'ready', categories: directory.categories, locations }}
      {...overrides}
    />,
    { wrapper: TestSafeAreaProvider },
  );
}

describe('LocationsScreen', () => {
  it('renders searchable markers and rows while keeping hidden places out of the UI', async () => {
    const sourceLocation = locations[3];
    if (sourceLocation === undefined) throw new Error('Fixture is invalid.');
    const noCoordinates = {
      ...sourceLocation,
      id: 'poi:no-map',
      name: 'No Map Restroom',
      coordinates: null,
      searchable: true,
    };
    await renderLocations({
      state: {
        status: 'ready',
        categories: directory.categories,
        locations: [...locations, noCoordinates],
      },
    });

    expect(screen.getByTestId('locations-map').props.provider).toBe('google');
    expect(screen.getByLabelText('Campus locations drawer').props.bottomInset).toBeUndefined();
    const map = screen.getByTestId('locations-map');
    expect(map.props.initialRegion).toMatchObject({ latitude: 38.5382, longitude: -121.7617 });
    expect(Children.count(screen.getByTestId('locations-map').props.children)).toBeGreaterThan(0);
    await waitFor(() =>
      expect(
        screen.getByLabelText('Financial Aid and Scholarships, Prospective Students'),
      ).toBeOnTheScreen(),
    );
    expect(
      screen.getByLabelText('Financial Aid and Scholarships, Prospective Students').props.children,
    ).toBeUndefined();
    expect(
      screen.getByLabelText('Financial Aid and Scholarships, Prospective Students').props
        .tracksViewChanges,
    ).toBe(false);
    expect(await screen.findByLabelText('Silo, Academic & Administration')).toBeOnTheScreen();
    expect(
      await screen.findByLabelText('Gateway Parking Structure, C (Visitor) Permit Parking'),
    ).toBeOnTheScreen();
    expect(
      screen.queryByLabelText('Gender-Inclusive Restroom, Gender Inclusive Restrooms'),
    ).not.toBeOnTheScreen();
    expect(
      screen.queryByLabelText('Orchard Park Apartments, 1271 Blue Ridge Road'),
    ).not.toBeOnTheScreen();
    expect(
      screen.queryByLabelText('No Map Restroom, Gender Inclusive Restrooms'),
    ).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /No Map Restroom/ })).toBeDisabled();
  });

  it('filters the drawer list in real time and only keeps matching markers', async () => {
    await renderLocations();
    const user = userEvent.setup();

    await user.type(screen.getByRole('search', { name: 'Search campus locations' }), 'visitor');

    expect(screen.getByRole('button', { name: /Gateway Parking Structure/ })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /Silo/ })).not.toBeOnTheScreen();
    expect(
      screen.getByLabelText('Gateway Parking Structure, C (Visitor) Permit Parking'),
    ).toBeOnTheScreen();
    expect(screen.queryByLabelText('Silo, Academic & Administration')).not.toBeOnTheScreen();
  });

  it('zooms to the expansion level when a cluster is pressed', async () => {
    const location = locations[0];
    if (location === undefined) throw new Error('Fixture is invalid.');
    const nearbyLocations = Array.from({ length: 3 }, (_, index) => ({
      ...location,
      coordinates: location.coordinates
        ? { ...location.coordinates, lng: location.coordinates.lng + index * 0.0001 }
        : null,
      id: `poi:cluster-${index}`,
      name: `Cluster location ${index}`,
    }));
    await renderLocations({
      state: { status: 'ready', categories: directory.categories, locations: nearbyLocations },
    });

    const cluster = await screen.findByLabelText('3 locations, tap to zoom in');
    const map = screen.getByTestId('locations-map');
    const currentZoom = 17.5;
    const delta = (360 * 400) / (256 * 2 ** currentZoom);
    await fireEvent(map, 'regionChange', {
      latitude: location.coordinates?.lat ?? 0,
      longitude: (location.coordinates?.lng ?? 0) + 0.0001,
      latitudeDelta: delta,
      longitudeDelta: delta,
    });
    await fireEvent.press(cluster);

    const animateCamera = map.props.__mapMethods.animateCamera;
    expect(animateCamera).toHaveBeenCalledWith(
      expect.objectContaining({
        center: {
          latitude: expect.closeTo(location.coordinates?.lat ?? 0, 5),
          longitude: expect.closeTo((location.coordinates?.lng ?? 0) + 0.0001, 5),
        },
        zoom: expect.any(Number),
      }),
      { duration: 350 },
    );
    const camera = animateCamera.mock.calls.at(-1)?.[0] as { zoom: number };
    expect(camera.zoom).toBeCloseTo(currentZoom + 1);
  });

  it('updates clusters during a live pinch zoom', async () => {
    const location = locations[0];
    if (location === undefined || location.coordinates === null) {
      throw new Error('Fixture is invalid.');
    }
    const coordinates = location.coordinates;
    const nearbyLocations = Array.from({ length: 3 }, (_, index) => ({
      ...location,
      coordinates: { ...coordinates, lng: coordinates.lng + index * 0.0001 },
      id: `poi:pinch-${index}`,
      name: `Pinch location ${index}`,
    }));
    await renderLocations({
      state: { status: 'ready', categories: directory.categories, locations: nearbyLocations },
    });

    expect(await screen.findByLabelText('3 locations, tap to zoom in')).toBeOnTheScreen();
    const map = screen.getByTestId('locations-map');
    const longitude = coordinates.lng + 0.0001;
    const delta = (360 * 400) / (256 * 2 ** 21);
    await fireEvent(map, 'regionChange', {
      latitude: coordinates.lat,
      longitude,
      latitudeDelta: delta,
      longitudeDelta: delta,
    });

    expect(
      await screen.findByLabelText('Pinch location 1, Prospective Students'),
    ).toBeOnTheScreen();
    expect(screen.queryByLabelText('3 locations, tap to zoom in')).not.toBeOnTheScreen();
  });

  it('applies a selected category to the list and map and fits its pins above the drawer', async () => {
    const first = locations[0];
    if (first === undefined) throw new Error('Fixture is invalid.');
    const second = {
      ...first,
      id: 'poi:student-support',
      name: 'Student Support Center',
      coordinates: { lat: 38.536, lng: -121.771 },
    };
    await renderLocations({
      state: {
        status: 'ready',
        categories: directory.categories,
        locations: [...locations, second],
      },
    });
    const user = userEvent.setup();

    const categoryChip = screen.getByRole('button', { name: 'Student & Staff Resources' });
    expect(screen.getByTestId('locations-category-scroll').props.horizontal).toBe(true);
    await user.press(categoryChip);

    expect(
      screen.getByRole('button', { name: 'Student & Staff Resources' }).props.accessibilityState,
    ).toEqual({ selected: true });
    expect(
      screen.getByRole('button', { name: /Financial Aid and Scholarships/ }),
    ).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /Student Support Center/ })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /Silo/ })).not.toBeOnTheScreen();
    expect(
      await screen.findByLabelText('Financial Aid and Scholarships, Prospective Students'),
    ).toBeOnTheScreen();
    expect(screen.queryByLabelText('Silo, Academic & Administration')).not.toBeOnTheScreen();
    const map = screen.getByTestId('locations-map');
    expect(map.props.__mapMethods.fitToCoordinates).toHaveBeenCalledWith(
      [
        { latitude: first.coordinates?.lat, longitude: first.coordinates?.lng },
        { latitude: second.coordinates.lat, longitude: second.coordinates.lng },
      ],
      { animated: true },
    );
    expect(map.props.mapPadding.top).toBeGreaterThan(8);
    expect(map.props.mapPadding.bottom).toBeGreaterThan(8);

    const searchInput = screen.getByRole('search', { name: 'Search campus locations' });
    await user.type(searchInput, 'student support');
    expect(screen.getByRole('button', { name: /Student Support Center/ })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /Financial Aid/ })).not.toBeOnTheScreen();

    await user.press(categoryChip);
    expect(
      screen.getByRole('button', { name: 'Student & Staff Resources' }).props.accessibilityState,
    ).toEqual({ selected: false });
    expect(screen.getByRole('button', { name: 'All' }).props.accessibilityState).toEqual({
      selected: true,
    });
  });

  it('selects a row, animates to a tight region, and shows the selected card', async () => {
    await renderLocations();
    const user = userEvent.setup();

    await user.press(screen.getByRole('button', { name: /Silo/ }));

    await waitFor(() => expect(screen.getByTestId('selected-location-card')).toBeOnTheScreen());
    expect(screen.getByTestId('locations-map').props.mapPadding.bottom).toBeLessThan(
      Dimensions.get('window').height * 0.3,
    );
    expect(
      screen.getByTestId('locations-map').props.__mapMethods.animateToRegion,
    ).toHaveBeenCalledWith(
      {
        latitude: 38.538729,
        longitude: -121.753108,
        latitudeDelta: 0.004,
        longitudeDelta: 0.004,
      },
      350,
    );
    expect(
      within(screen.getByTestId('selected-location-card')).getByText('Silo'),
    ).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Clear selected location' })).toBeOnTheScreen();
  });

  it('selects a location when its marker is pressed', async () => {
    await renderLocations();

    await fireEvent.press(
      screen.getByLabelText('Gateway Parking Structure, C (Visitor) Permit Parking'),
    );

    expect(await screen.findByTestId('selected-location-card')).toBeOnTheScreen();
    expect(
      within(screen.getByTestId('selected-location-card')).getByText('Gateway Parking Structure'),
    ).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Gateway Parking Structure, C (Visitor) Permit Parking').props.zIndex,
    ).toBe(1000);
    expect(
      screen.getByLabelText('Gateway Parking Structure, C (Visitor) Permit Parking').props.pinColor,
    ).toBe(SELECTED_PIN_COLOR);
    expect(
      screen.getByLabelText('Gateway Parking Structure, C (Visitor) Permit Parking').props.children,
    ).toBeUndefined();
  });

  it('honors a selected deep-link id after the directory loads', async () => {
    await renderLocations({ initialSelectedId: 'parking:30' });

    expect(await screen.findByTestId('selected-location-card')).toBeOnTheScreen();
    expect(
      within(screen.getByTestId('selected-location-card')).getByText('Gateway Parking Structure'),
    ).toBeOnTheScreen();
    expect(
      screen.getByTestId('locations-map').props.__mapMethods.animateToRegion,
    ).toHaveBeenCalled();
  });

  it('shows the marker for a selected hidden deep link', async () => {
    await renderLocations({ initialSelectedId: 'bldg:orchard-1271' });

    const card = await screen.findByTestId('selected-location-card');
    expect(within(card).getByText('Orchard Park Apartments')).toBeOnTheScreen();
    expect(within(card).getByText('1271 Blue Ridge Road')).toBeOnTheScreen();
    expect(
      await screen.findByLabelText('Orchard Park Apartments, 1271 Blue Ridge Road'),
    ).toBeOnTheScreen();
  });

  it('shows an accessible back button that calls the route handler', async () => {
    const onBack = jest.fn();
    await renderLocations({ onBack });

    await userEvent.setup().press(screen.getByRole('button', { name: 'Back' }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('does not auto-select a location without a selected parameter', async () => {
    await renderLocations();

    expect(screen.queryByTestId('selected-location-card')).not.toBeOnTheScreen();
    expect(
      screen.getByLabelText('Financial Aid and Scholarships, Prospective Students').props.pinColor,
    ).not.toBe('#D32F2F');
  });

  it('shows loading, error, and empty states', async () => {
    const onRetry = jest.fn();
    const rendered = await render(
      <LocationsScreen onBack={jest.fn()} onRetry={onRetry} state={{ status: 'loading' }} />,
      { wrapper: TestSafeAreaProvider },
    );
    expect(screen.getByTestId('locations-map')).toBeOnTheScreen();
    expect(screen.getByTestId('locations-loading-pill')).toBeOnTheScreen();
    expect(screen.getByText('Loading the campus directory…')).toBeOnTheScreen();

    await rendered.rerender(
      <LocationsScreen
        onBack={jest.fn()}
        onRetry={onRetry}
        state={{ status: 'error', message: 'Directory unavailable.' }}
      />,
    );
    expect(screen.getByTestId('locations-map')).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Could not load locations. Tap to retry.' }),
    ).toBeOnTheScreen();
    await userEvent.setup().press(screen.getByTestId('locations-error-retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Directory unavailable.')).toBeOnTheScreen();

    await rendered.rerender(
      <LocationsScreen
        onBack={jest.fn()}
        onRetry={onRetry}
        state={{ status: 'ready', categories: [], locations: [] }}
      />,
    );
    expect(screen.getByText('No locations available')).toBeOnTheScreen();
  });
});
