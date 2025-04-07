import { QueryClient } from 'react-query';

// Single source of truth for query configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchInterval: false,
      staleTime: 30 * 60 * 1000, // 30 minutes
      cacheTime: 60 * 60 * 1000, // 1 hour
    },
  },
});

// Prevent multiple instances
if (typeof window !== 'undefined') {
  (window as any).__QUERY_CLIENT__ = queryClient;
}
