import React, { useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { handleAuthCallback, refreshSession, checkStoredSession } from './services/auth';
import { VideoProvider } from './contexts/VideoContext';
import { queryClient } from './services/queryClient';

const router = createBrowserRouter([
  {
    path: '*',
    element: <Layout />,
  },
]);

function App() {
  const { setAuth } = useAuthStore();

  useEffect(() => {
    console.log('[App] Initial mount');
    
    // Initial session check
    const wasRestored = checkStoredSession();
    console.log('[App] Session restored:', wasRestored);
    
    if (!wasRestored) {
      console.log('[App] Clearing queries due to failed session restore');
      queryClient.clear();
    }

    // Handle OAuth callback
    const authResult = handleAuthCallback();
    if (authResult) {
      console.log('[App] Handling OAuth callback');
      setAuth(authResult.accessToken, authResult.expiryTime);
      window.location.hash = '';
    }

    // Periodic session check
    const checkSession = setInterval(() => {
      console.log('[App] Running periodic session check');
      const wasRefreshed = refreshSession();
      if (!wasRefreshed) {
        console.log('[App] Session refresh failed, invalidating queries');
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