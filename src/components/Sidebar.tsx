import React from 'react';
import { Link } from 'react-router-dom';
import { MenuItem } from '../types/menu';
import { motion } from 'framer-motion';

interface SidebarProps {
  isOpen: boolean;
  menuItems: MenuItem[];
  currentPath: string;
}

export function Sidebar({ isOpen, menuItems, currentPath }: SidebarProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 256, opacity: 1 }}
      className="hidden md:block h-full bg-white border-r border-gray-200 overflow-y-auto"
    >
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item, index) => (
            <li key={index}>
              <Link
                to={item.href}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  currentPath === item.href
                    ? 'bg-red-50 text-red-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </motion.aside>
  );
}