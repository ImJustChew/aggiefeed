import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { LocationsRequestError, fetchLocations } from '@/api/locations';
import { locationsFixture } from '@/domain/fixtures/locations.fixture';
import { parseLocations } from '@/domain/parseLocations';
import { createQueryClient } from '@/lib/queryClient';

import { useLocations } from '../useLocations';

jest.mock('@/api/locations', () => {
  const actual = jest.requireActual<typeof import('@/api/locations')>('@/api/locations');

  return {
    ...actual,
    fetchLocations: jest.fn(),
  };
});

const mockedFetchLocations = jest.mocked(fetchLocations);

function wrapper(queryClient: QueryClient) {
  return function QueryClientWrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('location hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createQueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
  });

  afterEach(() => {
    cleanup();
    queryClient.clear();
    mockedFetchLocations.mockReset();
  });

  it('loads the directory with one long-lived query', async () => {
    const directory = parseLocations(locationsFixture);
    mockedFetchLocations.mockResolvedValue(directory);

    const { result } = await renderHook(() => useLocations(), { wrapper: wrapper(queryClient) });

    await waitFor(() => expect(result.current.data).toBe(directory));
    expect(result.current.error).toBeNull();
    expect(mockedFetchLocations).toHaveBeenCalledWith({ signal: expect.any(AbortSignal) });
    const cachedQuery = queryClient.getQueryCache().find({ queryKey: ['locations'] });
    expect((cachedQuery?.options as { staleTime?: number }).staleTime).toBe(24 * 60 * 60 * 1000);
  });

  it('exposes typed request errors', async () => {
    const error = new LocationsRequestError(503);
    mockedFetchLocations.mockRejectedValue(error);

    const { result } = await renderHook(() => useLocations(), { wrapper: wrapper(queryClient) });

    await waitFor(() => expect(result.current.error).toBe(error));
    expect(result.current.isError).toBe(true);
  });
});
