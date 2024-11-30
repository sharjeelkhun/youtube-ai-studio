import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MenuItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

interface SidebarProps {
  isOpen: boolean;
  menuItems: MenuItem[];
  currentPath: string;
}

export function Sidebar({ isOpen, menuItems, currentPath }: SidebarProps) {
  return (
    <aside className={`${isOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 ease-in-out`}>
      <nav className="h-full py-4">
        <ul className="space-y-2">
          {menuItems.map((item, index) => (
            <li key={index}>
              <Link
                to={item.href}
                className={`flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-blue-600 ${
                  currentPath === item.href ? 'bg-blue-50 text-blue-600' : ''
                }`}
              >
                <item.icon className="w-6 h-6" />
                {isOpen && <span className="ml-3">{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}