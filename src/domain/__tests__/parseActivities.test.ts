import { flattenActivities } from '@/domain/activity';
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
      summarySegments: [
        {
          kind: 'text',
          text: "Research can help life-saving therapies travel farther—You'll learn more. ",
        },
        { kind: 'link', text: 'Read the story', url: 'https://example.com/story' },
      ],
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
      summarySegments: null,
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
      summarySegments: null,
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

  it('keeps fallback ids unique across pages when flattening', () => {
    const firstPage = parseActivities([{}], 0);
    const secondPage = parseActivities([{}], 25);

    expect(flattenActivities([firstPage, secondPage]).map(({ id }) => id)).toEqual([
      'activity-0',
      'activity-25',
    ]);
  });

  it('drops unsafe activity URLs', () => {
    const [activity] = parseActivities([
      { object: { ucdEdusModel: { url: 'javascript:alert(1)' } } },
      { object: { ucdEdusModel: { url: '/story' } } },
      { object: { ucdEdusModel: { url: 'https://example.com/story' } } },
    ]);

    expect(activity?.url).toBeNull();
    expect(parseActivities([{ object: { ucdEdusModel: { url: '/story' } } }])[0]?.url).toBeNull();
    expect(
      parseActivities([{ object: { ucdEdusModel: { url: 'https://example.com/story' } } }])[0]?.url,
    ).toBe('https://example.com/story');
  });
});
