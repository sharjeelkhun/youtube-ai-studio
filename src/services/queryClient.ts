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
  // Add query lifecycle logging
  queryCache: {
    onError: (error, query) => {
      console.log(`[Query Error] ${query.queryKey}: ${error}`);
    },
    onSuccess: (data, query) => {
      console.log(`[Query Success] ${query.queryKey}`);
    },
    onStale: (query) => {
      console.log(`[Query Stale] ${query.queryKey}`);
    },
  }
});

// Add query state change listener
queryClient.getQueryCache().subscribe((event) => {
  if (event?.type === 'queryUpdated') {
    console.log(`[Query Updated] ${event.query.queryKey}:`, {
      state: event.query.state,
      isStale: event.query.isStale(),
      lastUpdated: event.query.state.dataUpdatedAt
    });
  }
});

// Global instance
if (typeof window !== 'undefined') {
  // @ts-ignore
  if (!window.__QUERY_CLIENT__) {
    // @ts-ignore
    window.__QUERY_CLIENT__ = queryClient;
  }
}
