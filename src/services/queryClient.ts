import { QueryClient } from 'react-query';
import { logger } from '../utils/logger';

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
  queryCache: {
    onError: (error, query) => {
      logger.error(`Query failed: ${JSON.stringify(query.queryKey)}`, error);
    },
    onSuccess: (data, query) => {
      logger.query(`Success: ${JSON.stringify(query.queryKey)}`);
    },
    onStale: (query) => {
      logger.cache(`Query became stale: ${JSON.stringify(query.queryKey}`);
    }
  }
});

// Add detailed cache monitoring
queryClient.getQueryCache().subscribe((event) => {
  if (event?.type === 'queryUpdated') {
    logger.cache('Query cache updated', {
      key: event.query.queryKey,
      state: event.query.state.status,
      isStale: event.query.isStale(),
      lastUpdated: new Date(event.query.state.dataUpdatedAt).toISOString(),
      observers: event.query.getObserversCount()
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
