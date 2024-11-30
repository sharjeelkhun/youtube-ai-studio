import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { VideoData } from '../services/youtube';

interface PerformanceChartProps {
  data: VideoData[];
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  const chartData = data
    .sort((a, b) => new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime())
    .map(video => ({
      date: video.uploadDate,
      views: parseInt(video.views),
      likes: parseInt(video.likes)
    }));

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold mb-6">Channel Performance</h3>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date"
              tickFormatter={(date) => format(parseISO(date), 'MMM d')}
              stroke="#9CA3AF"
            />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              labelFormatter={(date) => format(parseISO(date as string), 'MMM d, yyyy')}
            />
            <Area
              type="monotone"
              dataKey="views"
              stroke="#3B82F6"
              fillOpacity={1}
              fill="url(#colorViews)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}