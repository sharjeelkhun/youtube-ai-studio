import React from 'react';
import { useAuthStore } from '../store/authStore';
import { Settings, User, Bell, Shield, Palette, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

export function SettingsTab() {
  const { logout, accessToken } = useAuthStore();

  const settings = [
    {
      icon: User,
      title: 'Account Settings',
      description: 'Manage your YouTube account information and preferences',
      href: 'https://studio.youtube.com/channel/account',
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Configure your notification preferences for uploads and interactions',
      href: 'https://studio.youtube.com/channel/notifications',
    },
    {
      icon: Shield,
      title: 'Privacy & Security',
      description: 'Control your privacy settings and security options for your channel',
      href: 'https://studio.youtube.com/channel/privacy',
    },
    {
      icon: Palette,
      title: 'Channel Customization',
      description: 'Customize your channel layout, branding, and basic info',
      href: 'https://studio.youtube.com/channel/customization',
    },
  ];

  if (!accessToken) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="text-center">
          <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in Required</h2>
          <p className="text-gray-600">Please sign in to access your settings</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto space-y-6 p-6"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your YouTube AI Studio preferences</p>
      </div>

      <div className="grid gap-6">
        {settings.map((setting, index) => (
          <motion.a
            key={index}
            href={setting.href}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-50 rounded-lg">
                <setting.icon className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">{setting.title}</h3>
                <p className="text-gray-600">{setting.description}</p>
              </div>
            </div>
          </motion.a>
        ))}
      </div>

      <div className="mt-8 pt-8 border-t">
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </motion.div>
  );
}