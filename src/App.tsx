import React, { useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { handleAuthCallback, refreshSession, checkStoredSession } from './services/auth';
import { VideoProvider } from './contexts/VideoContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchInterval: false,
      staleTime: Infinity,
      cacheTime: Infinity,
    },
  },
});

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

    // Check session validity periodically
    const checkSession = setInterval(() => {
      refreshSession();
    }, 60000); // Check every minute

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