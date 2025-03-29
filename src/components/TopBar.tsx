import React from 'react';
import { Menu, Bell, Search, LogIn } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { initiateAuth } from '../services/auth';
import toast from 'react-hot-toast';

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { isAuthenticated, logout } = useAuthStore();

  const handleAuth = async () => {
    if (isAuthenticated) {
      logout();
      toast.success('Logged out successfully');
    } else {
      initiateAuth();
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
            <img 
              src="https://www.youtube.com/s/desktop/7c155e84/img/favicon_32x32.png"
              alt="YouTube Logo"
              className="w-6 h-6"
            />
            <h1 className="text-xl font-semibold hidden md:block">YouTube AI Studio</h1>
            <h1 className="text-xl font-semibold md:hidden">YT AI Studio</h1>
          </div>
        </div>

        <div className="flex-1 max-w-2xl mx-8 hidden md:block">
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
                <span className="hidden md:inline">Logout</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span className="hidden md:inline">Sign In with YouTube</span>
                <span className="md:hidden">Sign In</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}