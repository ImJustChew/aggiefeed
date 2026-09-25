export const feedFixture: unknown = [
  {
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
  },
  {
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
          location: ', , ',
          startDate: '2026-09-25T21:10:00Z',
          endDate: '2026-09-25T22:00:00Z',
          isAllDay: false,
          hasStartTime: true,
          hasEndTime: true,
        },
      },
    },
  },
  {},
];
