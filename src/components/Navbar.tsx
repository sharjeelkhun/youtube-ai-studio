import React from 'react';
import { Menu } from '@headlessui/react';
import { LogOut, User, Youtube } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useQuery } from 'react-query';

export function ProfileButton() {
  const { accessToken, logout } = useAuthStore();
  const { data: profile, isLoading } = useQuery(
    'channelProfile',
    async () => {
      if (!accessToken) return null;
      const res = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        }
      );
      const data = await res.json();
      if (!data.items?.[0]) throw new Error('No channel found');
      
      return {
        id: data.items[0].id,
        name: data.items[0].snippet.title,
        picture: data.items[0].snippet.thumbnails.default.url,
        subscribers: data.items[0].statistics.subscriberCount
      };
    },
    {
      enabled: !!accessToken,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2
    }
  );

  if (!accessToken) return null;

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
        {isLoading ? (
          <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
        ) : profile ? (
          <>
            <img
              src={profile.picture}
              alt={profile.name}
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="text-left hidden md:block">
              <div className="text-sm font-medium text-gray-900">{profile.name}</div>
              <div className="text-xs text-gray-500">
                {parseInt(profile.subscribers).toLocaleString()} subscribers
              </div>
            </div>
          </>
        ) : (
          <Youtube className="w-6 h-6 text-gray-600" />
        )}
      </Menu.Button>

      <Menu.Items className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200">
        {profile && (
          <Menu.Item>
            {({ active }) => (
              <a
                href={`https://youtube.com/channel/${profile.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 px-4 py-2 text-sm ${
                  active ? 'bg-gray-50' : ''
                }`}
              >
                <User className="w-4 h-4" />
                View Channel
              </a>
            )}
          </Menu.Item>
        )}
        
        <Menu.Item>
          {({ active }) => (
            <button
              onClick={logout}
              className={`flex items-center gap-2 px-4 py-2 text-sm text-red-600 w-full ${
                active ? 'bg-red-50' : ''
              }`}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          )}
        </Menu.Item>
      </Menu.Items>
    </Menu>
  );
}