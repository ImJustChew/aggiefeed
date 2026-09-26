import { render, screen, userEvent } from '@testing-library/react-native';

import type { Activity } from '@/domain/activity';

import { FeedItem } from '../FeedItem';

function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 'story-1',
    title: 'A campus story',
    source: 'The Newsroom',
    objectType: 'notification',
    published: new Date('2026-09-25T12:00:00Z'),
    summary: 'A short story summary.',
    url: null,
    event: null,
    ...overrides,
  };
}

describe('FeedItem', () => {
  it('renders title and source fallbacks, omits a null summary, and handles presses', async () => {
    const onPress = jest.fn();
    await render(
      <FeedItem
        activity={makeActivity({ title: null, source: null, summary: null, published: null })}
        index={0}
        onPress={onPress}
      />,
    );

    expect(screen.getByText('Untitled')).toBeOnTheScreen();
    expect(screen.getByText('Unknown source · Date unavailable')).toBeOnTheScreen();
    expect(screen.queryByText('No summary available.')).not.toBeOnTheScreen();

    const user = userEvent.setup();
    await user.press(screen.getByRole('button', { name: 'Untitled. Unknown source' }));
    expect(onPress).toHaveBeenCalledWith('story-1');
  });

  it('renders an event label', async () => {
    await render(
      <FeedItem
        activity={makeActivity({
          objectType: 'event',
          event: {
            start: new Date('2026-09-25T12:00:00Z'),
            end: null,
            location: null,
            isAllDay: false,
          },
        })}
        index={0}
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText('Event · Fri, Sep 25')).toBeOnTheScreen();
  });
});
