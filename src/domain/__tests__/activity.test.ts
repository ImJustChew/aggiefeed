import type { Activity } from '../activity';
import { filterActivities, flattenActivities, isEvent } from '../activity';

function activity(id: string, objectType: string | null = 'notification'): Activity {
  return {
    id,
    title: id,
    source: null,
    objectType,
    published: null,
    summary: null,
    summarySegments: null,
    url: null,
    event: null,
  };
}

describe('activity helpers', () => {
  it('keeps the existing event detection semantics', () => {
    expect(isEvent(activity('metadata', 'event'))).toBe(true);
    expect(
      isEvent({
        ...activity('details'),
        event: { start: null, end: null, location: null, isAllDay: false },
      }),
    ).toBe(true);
    expect(isEvent(activity('news'))).toBe(false);
  });

  it('filters news and events without changing their order', () => {
    const activities = [activity('news-1'), activity('event-1', 'event'), activity('news-2')];

    expect(filterActivities(activities, 'all')).toEqual(activities);
    expect(filterActivities(activities, 'news').map(({ id }) => id)).toEqual(['news-1', 'news-2']);
    expect(filterActivities(activities, 'events').map(({ id }) => id)).toEqual(['event-1']);
  });

  it('flattens pages and keeps the first activity for duplicate ids', () => {
    const duplicate = activity('duplicate', 'event');

    expect(
      flattenActivities([
        [activity('one'), duplicate],
        [duplicate, activity('two')],
      ]),
    ).toEqual([activity('one'), duplicate, activity('two')]);
  });
});
