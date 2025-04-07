import { QueryClient } from 'react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchInterval: false,
      staleTime: 24 * 60 * 60 * 1000, // 24 hours
      cacheTime: 7 * 24 * 60 * 60 * 1000, // 7 days
      suspense: false,
    },
  },
});

// Global instance
if (typeof window !== 'undefined') {
  // @ts-ignore
  if (!window.__QUERY_CLIENT__) {
    // @ts-ignore
    window.__QUERY_CLIENT__ = queryClient;
  }
}
