export const newsItem = {
  id: 'news-1',
  title: 'Up to $36.5M Funds &#8216;Cyborg&#8217; Cell Project',
  published: '2026-09-24T22:00:31.573Z',
  actor: { displayName: 'UC Davis Engineering' },
  object: {
    objectType: 'notification',
    content:
      'Research can help life-saving therapies travel farther&#8212;You\'\'ll learn more. <a href="https://example.com/story">Read the story</a>',
    ucdEdusModel: { url: 'https://example.com/story' },
  },
};

export const eventWithLocation = {
  id: 'event-1',
  title: 'Networking (virtual)',
  published: '2026-09-18T04:10:35.889Z',
  actor: { displayName: 'Career Center' },
  object: {
    objectType: 'event',
    content: 'Build your professional network.',
    ucdEdusModel: {
      url: 'https://example.com/event',
      event: {
        location: 'Student Community Center, Room 100',
        startDate: '2026-09-25T21:10:00Z',
        endDate: '2026-09-25T22:00:00Z',
        isAllDay: false,
        hasStartTime: true,
        hasEndTime: true,
      },
    },
  },
};

export const allDayEvent = {
  id: 'event-all-day',
  title: 'Fall quarter begins',
  published: '2026-09-01T16:00:00Z',
  actor: { displayName: 'UC Davis Calendar' },
  object: {
    objectType: 'event',
    content: 'The academic quarter begins.',
    ucdEdusModel: {
      event: {
        location: 'UC Davis campus',
        startDate: '2026-09-28T00:00:00Z',
        endDate: '2026-09-29T00:00:00Z',
        isAllDay: true,
        hasStartTime: false,
      },
    },
  },
};

export const itemMissingFields = {};

export const feedFixture: unknown = [newsItem, eventWithLocation, allDayEvent, itemMissingFields];
