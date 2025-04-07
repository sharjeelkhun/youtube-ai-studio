import React from 'react';
import { Menu } from '@headlessui/react';
import { LogOut, Settings, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useQuery } from 'react-query';
import { getChannelProfile } from '../services/youtube';
import { useNavigate } from 'react-router-dom';

export function ProfileButton() {
  const { accessToken, logout } = useAuthStore();
  const navigate = useNavigate();

  const { data: profile } = useQuery(
    'channelProfile',
    () => getChannelProfile(accessToken!),
    {
      enabled: !!accessToken,
      staleTime: Infinity
    }
  );

  if (!profile) return null;

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors">
        <img
          src={profile.thumbnail}
          alt={profile.title}
          className="w-8 h-8 rounded-full object-cover border border-gray-200"
        />
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900">{profile.title}</p>
          <p className="text-xs text-gray-500">
            {parseInt(profile.subscriberCount).toLocaleString()} subscribers
          </p>
        </div>
      </Menu.Button>

      <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
        <Menu.Item>
          {({ active }) => (
            <a
              href={`https://youtube.com/channel/${profile.id}`}
              target="_blank"
              rel="noopener noreferrer" 
              className={`flex items-center gap-2 px-4 py-2 text-sm ${
                active ? 'bg-gray-100' : ''
              }`}
            >
              <User className="w-4 h-4" />
              View Channel
            </a>
          )}
        </Menu.Item>
        
        <Menu.Item>
          {({ active }) => (
            <button
              onClick={() => navigate('/settings')}
              className={`flex items-center gap-2 px-4 py-2 text-sm w-full ${
                active ? 'bg-gray-100' : ''
              }`}
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          )}
        </Menu.Item>

        <hr className="my-1" />

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
