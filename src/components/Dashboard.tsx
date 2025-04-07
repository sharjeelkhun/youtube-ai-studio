import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { getChannelVideos } from '../services/youtube';
import { getChannelAnalytics } from '../services/analytics';
import { useQuery } from 'react-query';
import { Loader2, ChevronDown, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { StatsCard } from './StatsCard';
import { PerformanceChart } from './PerformanceChart';
import { Recommendations } from './Recommendations';
import { TopVideosChart } from './TopVideosChart';

export function Dashboard() {
  const { accessToken, isAuthenticated } = useAuthStore();
  const [timeRange, setTimeRange] = useState('6m'); // Default to 6 months

  const { data: videos, isLoading: isLoadingVideos, error: videosError } = useQuery(
    ['videos', accessToken],
    () => getChannelVideos(accessToken!),
    {
      enabled: !!accessToken,
      staleTime: 5 * 60 * 1000,
    } 
  );

  const { data: analytics, isLoading: isLoadingAnalytics, error: analyticsError } = useQuery(
    ['analytics', videos, timeRange],
    () => getChannelAnalytics(accessToken!, videos!, timeRange),
    {
      enabled: !!videos,
      staleTime: 5 * 60 * 1000,
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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-7xl mx-auto px-4 py-8"
    >
      {/* Time Range Filter */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
            Analytics Overview
          </h2>
          <p className="text-gray-500 mt-1">Track your channel's performance</p>
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-gray-300 transition-colors">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="appearance-none bg-transparent pr-8 focus:outline-none text-gray-700"
            >
              <option value="lifetime">Lifetime</option>
              <option value="1y">Last 1 Year</option>
              <option value="6m">Last 6 Months</option>
              <option value="3m">Last 3 Months</option>
              <option value="1m">Last 1 Month</option>
              <option value="1w">Last Week</option>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3" />
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Summary Cards with animation */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatsCard
            title="Total Subscribers"
            value={totalSubscribers.toLocaleString()}
            trend="up"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <StatsCard
            title="Total Views"
            value={(analytics?.totalViews ?? 0).toLocaleString()}
            trend="up"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <StatsCard
            title="Total Likes"
            value={(analytics?.totalLikes ?? 0).toLocaleString()}
            trend="up"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <StatsCard
            title="Engagement Rate"
            value={`${(analytics?.engagementRate ?? 0).toFixed(2)}%`}
            trend="up"
          />
        </motion.div>
      </div>

      {/* Fallback Message */}
      {!hasData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center bg-gray-50 rounded-lg p-8"
        >
          <p className="text-gray-500 text-lg">No data available for the selected time range</p>
        </motion.div>
      )}

      {/* Analytics Section */}
      {hasData ? (
        <div className="grid gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <TopVideosChart
              videos={analytics.analyticsData.slice(0, 5).map((video) => ({
                title: video.title,
                views: parseInt(video.views || '0'),
              }))}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <Recommendations analytics={analytics || {}} />
          </motion.div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center bg-gray-50 rounded-lg p-8"
        >
          <p className="text-gray-500 text-lg">No data available for the selected time range</p>
        </motion.div>
      )}

      {/* Performance Chart */}
      {hasData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <PerformanceChart data={analytics.analyticsData} />
        </motion.div>
      )}
    </motion.div>
  );
}