import React, { useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
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

function App() {
  const { setAuth } = useAuthStore();

  useEffect(() => {
    logger.auth('App mounted');
    
    // Initial session check
    const wasRestored = checkStoredSession();
    logger.auth('Session restored', { success: wasRestored });
    
    if (!wasRestored) {
      console.log('[App] Clearing queries due to failed session restore');
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

    // Session check interval
    const checkSession = setInterval(() => {
      logger.auth('Periodic session check started');
      const wasRefreshed = refreshSession();
      if (!wasRefreshed) {
        logger.auth('Session refresh failed - invalidating queries');
        queryClient.invalidateQueries(['videos']);
        queryClient.invalidateQueries(['analytics']);
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(checkSession);
  }, [setAuth]);

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