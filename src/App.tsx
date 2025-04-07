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
    // Restore session on app start
    checkStoredSession();

    // Handle OAuth callback
    const authResult = handleAuthCallback();
    if (authResult) {
      setAuth(authResult.accessToken, authResult.expiryTime);
      window.location.hash = '';
    }

    // Reduced frequency of session checks to prevent unnecessary refreshes
    const checkSession = setInterval(() => {
      const wasRefreshed = refreshSession();
      if (!wasRefreshed) {
        // Only invalidate queries if session actually expired
        queryClient.invalidateQueries();
      }
    }, 5 * 60 * 1000); // Check every 5 minutes instead of every minute

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