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

function renderActivity(state: ActivityState, onOpenUrl = jest.fn()) {
  return render(<ActivityScreen state={state} onRetry={jest.fn()} onOpenUrl={onOpenUrl} />);
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
    expect(screen.getAllByText('Fri, Sep 25, 2026 · 12:00 PM')).toHaveLength(2);
    expect(screen.getByText('Source')).toBeOnTheScreen();
    expect(screen.getByText('Type')).toBeOnTheScreen();
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
    expect(screen.getAllByText('Unknown type')).toHaveLength(2);
    expect(screen.getAllByText('Date unavailable')).toHaveLength(2);
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
