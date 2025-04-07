import React, { useState } from 'react';
import { Menu, Video, Settings, LayoutDashboard, LogOut, Image, Search as SearchIcon } from 'lucide-react';
import { Link, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Dashboard } from './Dashboard';
import { VideosTab } from './VideosTab';
import { SettingsTab } from './SettingsTab';
import { ThumbnailEditor } from './ThumbnailEditor';
import { SEOAnalyzer } from './SEOAnalyzer';
import { useAuthStore } from '../store/authStore';
import { MobileMenu } from './MobileMenu';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
    { icon: Video, label: 'Videos', href: '/videos' },
    { icon: Image, label: 'Thumbnail Editor', href: '/editor' },
    { icon: SearchIcon, label: 'SEO Analyzer', href: '/seo' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ];

  // Protected route wrapper
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isAuthenticated) {
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar 
        onMenuClick={() => {
          if (window.innerWidth < 768) {
            setMobileMenuOpen(!mobileMenuOpen);
          } else {
            setSidebarOpen(!sidebarOpen);
          }
        }} 
      />
      
      <div className="flex h-[calc(100vh-64px)]">
        <Sidebar 
          isOpen={sidebarOpen} 
          menuItems={menuItems} 
          currentPath={location.pathname} 
        />
        
        <MobileMenu 
          isOpen={mobileMenuOpen} 
          onClose={() => setMobileMenuOpen(false)}
          menuItems={menuItems}
          currentPath={location.pathname}
        />

        <main className="flex-1 overflow-auto bg-gray-50">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/videos" element={
              <ProtectedRoute>
                <VideosTab />
              </ProtectedRoute>
            } />
            <Route path="/editor" element={
              <ProtectedRoute>
                <ThumbnailEditor />
              </ProtectedRoute>
            } />
            <Route path="/seo" element={
              <ProtectedRoute>
                <SEOAnalyzer />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <SettingsTab />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}