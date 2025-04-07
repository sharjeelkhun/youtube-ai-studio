import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatsCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  trend: 'up' | 'down';
  color: 'purple' | 'blue' | 'green' | 'orange';
}

const gradients = {
  purple: 'from-purple-500/10 to-purple-500/5',
  blue: 'from-blue-500/10 to-blue-500/5',
  green: 'from-emerald-500/10 to-emerald-500/5',
  orange: 'from-orange-500/10 to-orange-500/5',
};

const textColors = {
  purple: 'text-purple-700',
  blue: 'text-blue-700',
  green: 'text-emerald-700',
  orange: 'text-orange-700',
};

export function StatsCard({ icon, title, value, trend, color }: StatsCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`relative bg-gradient-to-br ${gradients[color]} backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl overflow-hidden group`}
    >
      <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
      
      <div className="flex items-center justify-between mb-2 relative">
        <div className={`p-2 rounded-lg ${gradients[color]} ${textColors[color]}`}>
          {icon}
        </div>
        <div className={`rounded-full p-2 ${
          trend === 'up' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'
        }`}>
          {trend === 'up' ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
        </div>
      </div>
      
      <div className="relative">
        <h3 className="text-sm font-medium text-gray-500 mb-1 group-hover:text-gray-700 transition-colors">
          {title}
        </h3>
        <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
          {value}
        </p>
      </div>
    </motion.div>
  );
}