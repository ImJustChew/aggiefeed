import { render, screen, userEvent } from '@testing-library/react-native';

import type { Activity } from '@/domain/activity';
import type { FeedState } from '@/hooks/useActivities';

import { FeedScreen } from '../FeedScreen';

function makeActivity(id = 'story-1'): Activity {
  return {
    id,
    title: 'Campus story',
    source: 'Campus source',
    objectType: 'notification',
    published: null,
    summary: 'A story summary.',
    url: null,
    event: null,
  };
}

function renderFeed(state: FeedState, onRefresh = jest.fn(), onPressActivity = jest.fn()) {
  return render(
    <FeedScreen
      state={state}
      isRefreshing={false}
      onRefresh={onRefresh}
      onPressActivity={onPressActivity}
    />,
  );
}

describe('FeedScreen', () => {
  it('shows loading state', async () => {
    await renderFeed({ status: 'loading' });
    expect(screen.getByRole('progressbar')).toBeOnTheScreen();
    expect(screen.getByText('Loading stories')).toBeOnTheScreen();
  });

  it('shows error state and retries', async () => {
    const onRefresh = jest.fn();
    await renderFeed({ status: 'error', message: 'Network unavailable.' }, onRefresh);

    expect(screen.getByText('Network unavailable.')).toBeOnTheScreen();
    const user = userEvent.setup();
    await user.press(screen.getByRole('button', { name: 'Retry' }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('shows empty state with a refresh action', async () => {
    const onRefresh = jest.fn();
    await renderFeed(
      { status: 'empty', query: '', filter: 'all', reason: 'feed-empty' },
      onRefresh,
    );
    expect(screen.getByText('No stories yet')).toBeOnTheScreen();

    const user = userEvent.setup();
    await user.press(screen.getByRole('button', { name: 'Refresh' }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('renders stories and sends the selected id to its callback', async () => {
    const onPressActivity = jest.fn();
    await renderFeed(
      {
        status: 'ready',
        activities: [makeActivity()],
        fetchedAt: new Date('2026-09-25T12:00:00Z'),
      },
      jest.fn(),
      onPressActivity,
    );

    expect(screen.getByText('Campus story')).toBeOnTheScreen();
    expect(screen.getByText('Campus source · Date unavailable')).toBeOnTheScreen();

    const user = userEvent.setup();
    await user.press(screen.getByRole('button', { name: 'Campus story. Campus source' }));
    expect(onPressActivity).toHaveBeenCalledWith('story-1');
  });
});
