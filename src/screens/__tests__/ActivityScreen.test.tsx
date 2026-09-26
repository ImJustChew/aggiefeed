import { render, screen, userEvent } from '@testing-library/react-native';

import type { Activity } from '@/domain/activity';
import type { ActivityState } from '@/hooks/useActivities';

import { ActivityScreen } from '../ActivityScreen';

function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 'story-1',
    title: 'Campus story',
    source: 'Campus source',
    objectType: 'notification',
    published: new Date('2026-09-25T12:00:00Z'),
    summary: 'A story summary.',
    url: null,
    event: null,
    ...overrides,
    summarySegments:
      overrides.summarySegments ??
      (overrides.summary === null ? null : [{ kind: 'text', text: 'A story summary.' }]),
  };
}

function renderActivity(state: ActivityState, onOpenUrl = jest.fn(), onRetry = jest.fn()) {
  return render(<ActivityScreen state={state} onRetry={onRetry} onOpenUrl={onOpenUrl} />);
}

describe('ActivityScreen', () => {
  it('shows the four required details', async () => {
    await renderActivity({ status: 'ready', activity: makeActivity() });

    expect(screen.getByText('Campus story')).toBeOnTheScreen();
    expect(screen.getByText('By Campus source')).toBeOnTheScreen();
    expect(screen.getByText('Campus source')).toBeOnTheScreen();
    expect(screen.getByText('News')).toBeOnTheScreen();
    expect(screen.getByText('Notification')).toBeOnTheScreen();
    expect(screen.getByText('Published')).toBeOnTheScreen();
    expect(screen.getAllByText('Fri, Sep 25, 2026 · 12:00 PM')[0]).toBeOnTheScreen();
    expect(screen.getByText('Source')).toBeOnTheScreen();
    expect(screen.getByText('Type')).toBeOnTheScreen();
  });

  it('shows a loading state while the activity is being fetched', async () => {
    await renderActivity({ status: 'loading' });

    expect(screen.getByRole('progressbar')).toBeOnTheScreen();
    expect(screen.getByText('Loading stories')).toBeOnTheScreen();
  });

  it('shows an error and retries when the activity fetch fails', async () => {
    const onRetry = jest.fn();
    await renderActivity({ status: 'error', message: 'Network unavailable.' }, jest.fn(), onRetry);

    expect(screen.getByText('Network unavailable.')).toBeOnTheScreen();

    const user = userEvent.setup();
    await user.press(screen.getByRole('button', { name: 'Retry' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows When and Where details for an event', async () => {
    await renderActivity({
      status: 'ready',
      activity: makeActivity({
        objectType: 'event',
        event: {
          start: new Date('2026-09-25T12:00:00Z'),
          end: new Date('2026-09-25T13:00:00Z'),
          location: 'Student Community Center, Room 100',
          isAllDay: false,
        },
      }),
    });

    expect(screen.getAllByText('Event')[0]).toBeOnTheScreen();
    expect(screen.getByText('Event details')).toBeOnTheScreen();
    expect(screen.getByText('When')).toBeOnTheScreen();
    expect(screen.getByText('Fri, Sep 25, 2026 · 12:00 – 1:00 PM')).toBeOnTheScreen();
    expect(screen.getByText('Where')).toBeOnTheScreen();
    expect(screen.getByText('Student Community Center, Room 100')).toBeOnTheScreen();
  });

  it('renders fallbacks and omits the link without a url', async () => {
    await renderActivity({
      status: 'ready',
      activity: makeActivity({
        title: null,
        source: null,
        objectType: null,
        published: null,
        summary: null,
      }),
    });

    expect(screen.getByText('Untitled')).toBeOnTheScreen();
    expect(screen.getByText('By Unknown source')).toBeOnTheScreen();
    expect(screen.getByText('Unknown source')).toBeOnTheScreen();
    expect(screen.getAllByText('Unknown type')[0]).toBeOnTheScreen();
    expect(screen.getAllByText('Date unavailable')[0]).toBeOnTheScreen();
    expect(screen.getByText('No summary available.')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Read full story' })).not.toBeOnTheScreen();
  });

  it('shows and opens the full story link when a url exists', async () => {
    const onOpenUrl = jest.fn();
    await renderActivity(
      { status: 'ready', activity: makeActivity({ url: 'https://example.com/story' }) },
      onOpenUrl,
    );

    const user = userEvent.setup();
    await user.press(screen.getByRole('button', { name: 'Read full story' }));
    expect(onOpenUrl).toHaveBeenCalledWith('https://example.com/story');
  });

  it('shows not-found state', async () => {
    await renderActivity({ status: 'not-found' });
    expect(screen.getByText('Activity not found')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Read full story' })).not.toBeOnTheScreen();
  });
});
