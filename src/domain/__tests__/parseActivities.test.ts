import { feedFixture } from '@/domain/fixtures/feed.fixture';
import { InvalidFeedError, parseActivities } from '@/domain/parseActivities';

describe('parseActivities', () => {
  it('normalizes news, events, and missing fields from a feed fixture', () => {
    const activities = parseActivities(feedFixture);

    expect(activities).toHaveLength(3);
    expect(activities[0]).toMatchObject({
      id: 'news-1',
      title: 'Up to $36.5M Funds ‘Cyborg’ Cell Project',
      source: 'UC Davis Engineering',
      objectType: 'notification',
      summary:
        "Research can help life-saving therapies travel farther—You'll learn more. Read the story",
      url: 'https://example.com/story',
    });
    expect(activities[1]?.event).toMatchObject({
      location: null,
      start: new Date('2026-09-25T21:10:00Z'),
      end: new Date('2026-09-25T22:00:00Z'),
      isAllDay: false,
    });
    expect(activities[2]).toEqual({
      id: 'activity-2',
      title: null,
      source: null,
      objectType: null,
      published: null,
      summary: null,
      url: null,
      event: null,
    });
  });

  it('skips non-object entries and handles mistyped fields without throwing', () => {
    const activities = parseActivities([
      null,
      'not an activity',
      42,
      [],
      {
        id: 42,
        _id: 'legacy-id',
        title: { unexpected: true },
        published: false,
        actor: 'wrong shape',
        object: {
          objectType: 42,
          content: false,
          ucdEdusModel: {
            url: [],
            event: {
              startDate: 42,
              endDate: null,
              location: ['wrong'],
              isAllDay: 'yes',
              hasStartTime: 'no',
            },
          },
        },
      },
    ]);

    expect(activities).toHaveLength(1);
    expect(activities[0]).toEqual({
      id: 'legacy-id',
      title: null,
      source: null,
      objectType: null,
      published: null,
      summary: null,
      url: null,
      event: {
        start: null,
        end: null,
        location: null,
        isAllDay: false,
      },
    });
  });

  it('throws a typed error for a non-array response', () => {
    expect(() => parseActivities({ message: 'bad request' })).toThrow(InvalidFeedError);
  });
});
