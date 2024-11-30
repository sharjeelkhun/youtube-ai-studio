import React from 'react';
import { Menu, Video, Settings, LayoutDashboard, LogOut, Image, Search as SearchIcon } from 'lucide-react';
import { Link, useLocation, Routes, Route } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Dashboard } from './Dashboard';
import { VideosTab } from './VideosTab';
import { SettingsTab } from './SettingsTab';
import { ThumbnailEditor } from './ThumbnailEditor';
import { SEOAnalyzer } from './SEOAnalyzer';

export function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
    { icon: Video, label: 'Videos', href: '/videos' },
    { icon: Image, label: 'Thumbnail Editor', href: '/editor' },
    { icon: SearchIcon, label: 'SEO Analyzer', href: '/seo' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex h-[calc(100vh-64px)]">
        <Sidebar isOpen={sidebarOpen} menuItems={menuItems} currentPath={location.pathname} />
        <main className="flex-1 overflow-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/videos" element={<VideosTab />} />
            <Route path="/editor" element={<ThumbnailEditor />} />
            <Route path="/seo" element={<SEOAnalyzer />} />
            <Route path="/settings" element={<SettingsTab />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}