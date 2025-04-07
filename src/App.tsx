import React, { useEffect, useCallback } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './components/Layout';
import { QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { handleAuthCallback, refreshSession, checkStoredSession } from './services/auth';
import { VideoProvider } from './contexts/VideoContext';
import { queryClient } from './services/queryClient';
import { logger } from './utils/logger';

const router = createBrowserRouter([
  {
    path: '*',
    element: <Layout />,
  },
]);

// Constants
const SESSION_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes

function App() {
  const { setAuth } = useAuthStore();

  // Memoize session check function
  const checkSession = useCallback(() => {
    logger.auth('Periodic session check started');
    const wasRefreshed = refreshSession();
    
    if (!wasRefreshed) {
      logger.auth('Session refresh failed - invalidating queries');
      queryClient.invalidateQueries(['videos']);
      queryClient.invalidateQueries(['analytics']);
    }
  }, []);

  useEffect(() => {
    logger.auth('App mounted');
    
    // Initial session check
    const wasRestored = checkStoredSession();
    logger.auth('Session restored', { success: wasRestored });
    
    if (!wasRestored) {
      logger.auth('Clearing queries - session not restored');
      queryClient.clear();
    }

    // Handle OAuth callback
    const authResult = handleAuthCallback();
    if (authResult) {
      logger.auth('OAuth callback handled', { 
        expiryTime: new Date(authResult.expiryTime).toISOString() 
      });
      setAuth(authResult.accessToken, authResult.expiryTime);
      window.location.hash = '';
    }

    // Set up session check interval
    const intervalId = setInterval(checkSession, SESSION_CHECK_INTERVAL);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [setAuth, checkSession]);

  return (
    <QueryClientProvider client={queryClient}>
      <VideoProvider>
        <RouterProvider router={router} />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </VideoProvider>
    </QueryClientProvider>
  );
}

export default App;