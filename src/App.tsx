import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ThumbnailEditor } from './components/ThumbnailEditor';
import { SEOAnalyzer } from './components/SEOAnalyzer';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';

const queryClient = new QueryClient();

function App() {
  const { setAccessToken } = useAuthStore();

  useEffect(() => {
    // Handle OAuth callback
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      if (accessToken) {
        setAccessToken(accessToken);
        window.location.hash = '';
      }
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/editor" element={<ThumbnailEditor />} />
            <Route path="/seo" element={<SEOAnalyzer />} />
          </Routes>
        </Layout>
      </Router>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}

export default App;