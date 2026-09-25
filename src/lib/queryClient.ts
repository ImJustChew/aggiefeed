import { QueryClient } from '@tanstack/react-query';
import type { QueryClientConfig } from '@tanstack/react-query';

const mobileQueryDefaults = {
  staleTime: 5 * 60 * 1000,
  retry: 1,
};

export function createQueryClient(config?: QueryClientConfig): QueryClient {
  return new QueryClient({
    ...config,
    defaultOptions: {
      ...config?.defaultOptions,
      queries: {
        ...mobileQueryDefaults,
        ...config?.defaultOptions?.queries,
      },
    },
  });
}
