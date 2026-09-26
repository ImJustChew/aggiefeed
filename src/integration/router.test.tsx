import { ExpoRoot, router } from 'expo-router';
import { getMockContext } from 'expo-router/testing-library';
import { act, cleanup, render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { fetchActivities } from '@/api/aggieFeed';
import type { Activity } from '@/domain/activity';

jest.mock('@/api/aggieFeed', () => {
  const actual = jest.requireActual<typeof import('@/api/aggieFeed')>('@/api/aggieFeed');

  return {
    ...actual,
    fetchActivities: jest.fn(),
  };
});

jest.mock('@/lib/queryClient', () => {
  const actual = jest.requireActual<typeof import('@/lib/queryClient')>('@/lib/queryClient');

  return {
    ...actual,
    createQueryClient: () =>
      actual.createQueryClient({
        defaultOptions: { queries: { gcTime: 0 } },
      }),
  };
});

const mockedFetchActivities = jest.mocked(fetchActivities);

const routeActivity: Activity = {
  id: 'route-story',
  title: 'Route story',
  source: 'Route source',
  objectType: 'notification',
  published: new Date('2026-09-25T12:00:00Z'),
  summary: 'A route test story.',
  url: null,
  event: null,
};

describe('Expo Router activity flow', () => {
  beforeEach(() => {
    jest.useRealTimers();
    jest.unmock('react-native-reanimated');
  });

  afterEach(async () => {
    await cleanup();
    jest.useRealTimers();
    mockedFetchActivities.mockReset();
  });

  it('navigates from the real feed route to details and back', async () => {
    mockedFetchActivities.mockResolvedValue([routeActivity]);

    await render(<ExpoRoot context={getMockContext('./src/app')} location="/" />);
    await screen.findByRole('button', { name: 'Route story. Route source' });

    const user = userEvent.setup();
    await user.press(screen.getByRole('button', { name: 'Route story. Route source' }));
    await screen.findByText('By Route source');

    expect(screen.getByText('Route story')).toBeOnTheScreen();
    expect(screen.getByText('By Route source')).toBeOnTheScreen();
    expect(screen.getByText('Notification')).toBeOnTheScreen();
    expect(screen.getAllByText('Fri, Sep 25, 2026 · 12:00 PM')).toHaveLength(2);

    await act(() => router.back());
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Route story. Route source' })).toBeOnTheScreen(),
    );
  });
});
