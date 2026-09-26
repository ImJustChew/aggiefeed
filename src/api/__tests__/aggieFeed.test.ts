import { FeedRequestError, fetchActivities } from '@/api/aggieFeed';
import { InvalidFeedError } from '@/domain/parseActivities';
import { feedFixture } from '@/domain/fixtures/feed.fixture';

describe('fetchActivities', () => {
  const fetchMock = jest.spyOn(globalThis, 'fetch');

  afterEach(() => {
    fetchMock.mockReset();
  });

  afterAll(() => {
    fetchMock.mockRestore();
  });

  it('fetches and parses a successful response', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(feedFixture),
    } as unknown as Response);

    const controller = new AbortController();
    const activities = await fetchActivities({ signal: controller.signal });

    expect(activities).toHaveLength(3);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://aggiefeed.ucdavis.edu/api/v1/activity/public?s=0&l=25',
      { signal: controller.signal, headers: { Accept: 'application/json' } },
    );
  });

  it('requests a later page with the fixed page size', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue([]),
    } as unknown as Response);

    await fetchActivities({ skip: 25, limit: 25 });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://aggiefeed.ucdavis.edu/api/v1/activity/public?s=25&l=25',
      expect.anything(),
    );
  });

  it('includes a trimmed full-text query and omits blank queries', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue([]),
    } as unknown as Response);

    await fetchActivities({ query: ' tennis ' });
    await fetchActivities({ query: '  ' });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://aggiefeed.ucdavis.edu/api/v1/activity/public?s=0&l=25&q=tennis',
      expect.anything(),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://aggiefeed.ucdavis.edu/api/v1/activity/public?s=0&l=25',
      expect.anything(),
    );
  });

  it('throws the HTTP status for a non-2xx response', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue('bad paging parameters'),
    } as unknown as Response);

    await expect(fetchActivities()).rejects.toMatchObject({
      name: 'FeedRequestError',
      status: 400,
    });
    await expect(fetchActivities()).rejects.toBeInstanceOf(FeedRequestError);
  });

  it('propagates a typed error for an invalid successful body', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ message: 'not an array' }),
    } as unknown as Response);

    await expect(fetchActivities()).rejects.toBeInstanceOf(InvalidFeedError);
  });
});
