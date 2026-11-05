import { fetchLocations } from '@/api/locations';
import { InvalidLocationsError } from '@/domain/parseLocations';
import { locationsFixture } from '@/domain/fixtures/locations.fixture';

describe('fetchLocations', () => {
  const fetchMock = jest.spyOn(globalThis, 'fetch');

  afterEach(() => {
    fetchMock.mockReset();
  });

  afterAll(() => {
    fetchMock.mockRestore();
  });

  it('fetches and parses the directory while passing through AbortSignal', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(locationsFixture),
    } as unknown as Response);

    const controller = new AbortController();
    const directory = await fetchLocations({ signal: controller.signal });

    expect(directory.places).toHaveLength(5);
    expect(fetchMock).toHaveBeenCalledWith('https://mobile.ucdavis.edu/api/v3/locations', {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
  });

  it('throws the HTTP status for a non-2xx response', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503 } as unknown as Response);

    await expect(fetchLocations()).rejects.toMatchObject({
      name: 'LocationsRequestError',
      status: 503,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('propagates a network rejection to the caller', async () => {
    const networkError = new TypeError('Failed to fetch');
    fetchMock.mockRejectedValue(networkError);

    await expect(fetchLocations()).rejects.toBe(networkError);
  });

  it('throws a typed error for an invalid successful body', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ places: 'not an array' }),
    } as unknown as Response);

    await expect(fetchLocations()).rejects.toBeInstanceOf(InvalidLocationsError);
  });
});
