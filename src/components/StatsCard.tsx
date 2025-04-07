import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  trend: 'up' | 'down';
  color: 'purple' | 'blue' | 'green' | 'orange';
}

export function StatsCard({ icon, title, value, trend, color }: StatsCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg border hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 rounded-lg bg-gray-50">{icon}</div>
        <div className={`rounded-full p-1.5 ${
          trend === 'up' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
        }`}>
          {trend === 'up' ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
        </div>
      </div>
      
      <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}