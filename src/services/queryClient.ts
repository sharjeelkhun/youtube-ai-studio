import { QueryClient } from 'react-query';

// Improve caching and refresh behavior
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: "always", // Only fetch on first mount
      refetchOnReconnect: false,
      refetchInterval: false,
      staleTime: 24 * 60 * 60 * 1000, // Consider data fresh for 24 hours
      cacheTime: 24 * 60 * 60 * 1000, // Keep in cache for 24 hours
    },
  },
});

// Prevent multiple instances
if (typeof window !== 'undefined') {
  (window as any).__QUERY_CLIENT__ = queryClient;
}
