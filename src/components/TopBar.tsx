import React from 'react';
import { Menu, Bell, Search, LogIn, Youtube } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { isAuthenticated, logout } = useAuthStore();

  const handleAuth = async () => {
    if (isAuthenticated) {
      logout();
      toast.success('Logged out successfully');
    } else {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        toast.error('Google Client ID is not configured');
        return;
      }

      const redirectUri = 'https://youtube-ai-studio.netlify.app';
      const scope = [
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.force-ssl',
      ].join(' ');

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.append('client_id', clientId);
      authUrl.searchParams.append('redirect_uri', redirectUri);
      authUrl.searchParams.append('response_type', 'token');
      authUrl.searchParams.append('scope', scope);
      authUrl.searchParams.append('include_granted_scopes', 'true');
      authUrl.searchParams.append('prompt', 'consent');

      window.location.href = authUrl.toString();
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Youtube className="w-6 h-6 text-red-600" />
            <h1 className="text-xl font-semibold">YouTube AI Studio</h1>
          </div>
        </div>

        <div className="flex-1 max-w-2xl mx-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search videos..."
              className="w-full px-4 py-2 pl-10 bg-gray-100 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500"
            />
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated && (
            <button className="p-2 hover:bg-gray-100 rounded-full relative">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          )}

          <button
            onClick={handleAuth}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {isAuthenticated ? (
              <>
                <img
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=32&h=32"
                  alt="Profile"
                  className="w-6 h-6 rounded-full"
                />
                <span>Logout</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Sign In with YouTube</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}