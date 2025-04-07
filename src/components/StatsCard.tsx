import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  trend: 'up' | 'down';
}

export function StatsCard({ title, value, trend }: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-500 group-hover:text-gray-700 transition-colors">
          {title}
        </h3>
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
      <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
        {value}
      </p>
    </div>
  );
}