import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { getChannelVideos } from '../services/youtube';
import { getChannelAnalytics } from '../services/analytics';
import { useQuery } from 'react-query';
import { Loader2, ChevronDown, Calendar, Users, Eye, ThumbsUp, Percent, BarChart2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { StatsCard } from './StatsCard';
import { PerformanceChart } from './PerformanceChart';
import { Recommendations } from './Recommendations';
import { TopVideosChart } from './TopVideosChart';

export function Dashboard() {
  const { accessToken, isAuthenticated } = useAuthStore();
  const [timeRange, setTimeRange] = useState('6m');

  const { data: videos, isLoading: isLoadingVideos, error: videosError } = useQuery(
    ['videos', accessToken],
    () => getChannelVideos(accessToken!),
    {
      enabled: !!accessToken,
      staleTime: 30 * 60 * 1000,
      cacheTime: 60 * 60 * 1000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false
    }
  );

  const { data: analytics, isLoading: isLoadingAnalytics, error: analyticsError } = useQuery(
    ['analytics', videos, timeRange],
    () => getChannelAnalytics(accessToken!, videos!, timeRange),
    {
      enabled: !!videos,
      staleTime: 30 * 60 * 1000,
      cacheTime: 60 * 60 * 1000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  );

  if (!isAuthenticated) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center h-[calc(100vh-64px)] bg-gradient-to-br from-gray-50 to-white"
      >
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 mb-4">
          Welcome to YouTube AI Studio
        </h1>
        <p className="text-gray-600 text-lg mb-8">Sign in with your YouTube account to get started</p>
      </motion.div>
    );
  }

  if (isLoadingVideos || isLoadingAnalytics) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] bg-gradient-to-br from-gray-50 to-white">
        <Loader2 className="w-12 h-12 animate-spin text-red-600 mb-4" />
        <p className="text-gray-600 animate-pulse">Loading your dashboard...</p>
      </div>
    );
  }

  if (videosError || analyticsError) {
    return (
      <div className="text-center text-red-500">
        <p>Failed to load data. Please try again later.</p>
      </div>
    );
  }

  const hasData = analytics && analytics.analyticsData?.length > 0;

  // Provide default values for undefined properties
  const totalSubscribers = analytics?.totalSubscribers ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Analytics Overview</h2>
          <p className="text-gray-600 mt-1">Track and optimize your channel's performance</p>
        </div>

        <div className="relative">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="appearance-none bg-white px-4 py-2 pr-8 border rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            <option value="lifetime">Lifetime</option>
            <option value="1y">Last 1 Year</option>
            <option value="6m">Last 6 Months</option>
            <option value="3m">Last 3 Months</option>
            <option value="1m">Last 1 Month</option>
            <option value="1w">Last Week</option>
          </select>
          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={<Users className="w-5 h-5" />}
          title="Total Subscribers"
          value={totalSubscribers.toLocaleString()}
          trend="up"
          color="purple"
        />
        <StatsCard
          icon={<Eye className="w-5 h-5" />}
          title="Total Views"
          value={(analytics?.totalViews ?? 0).toLocaleString()}
          trend="up"
          color="blue"
        />
        <StatsCard
          icon={<ThumbsUp className="w-5 h-5" />}
          title="Total Likes"
          value={(analytics?.totalLikes ?? 0).toLocaleString()}
          trend="up"
          color="green"
        />
        <StatsCard
          icon={<Percent className="w-5 h-5" />}
          title="Engagement Rate"
          value={`${(analytics?.engagementRate ?? 0).toFixed(2)}%`}
          trend="up"
          color="orange"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">Top Videos</h3>
          </div>
          <div className="p-4">
            <TopVideosChart videos={analytics?.analyticsData.slice(0, 5) || []} />
          </div>
        </div>

        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">AI Recommendations</h3>
          </div>
          <div className="p-4">
            <Recommendations analytics={analytics || {}} />
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Performance Trends</h3>
        </div>
        <div className="p-4">
          <PerformanceChart data={analytics?.analyticsData || []} />
        </div>
      </div>
    </div>
  );
}