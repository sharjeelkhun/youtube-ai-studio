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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 max-w-7xl mx-auto px-6 py-10"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-8">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 to-purple-500/20 blur-xl opacity-50 rounded-lg" />
          <div className="relative">
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-purple-900 to-gray-800">
              Analytics Overview
            </h2>
            <p className="text-gray-500 mt-1">Track and optimize your channel's performance</p>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 px-4 py-3 bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <Calendar className="w-5 h-5 text-purple-500" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="appearance-none bg-transparent pr-8 focus:outline-none text-gray-700 font-medium"
            >
              <option value="lifetime">Lifetime</option>
              <option value="1y">Last 1 Year</option>
              <option value="6m">Last 6 Months</option>
              <option value="3m">Last 3 Months</option>
              <option value="1m">Last 1 Month</option>
              <option value="1w">Last Week</option>
            </select>
            <ChevronDown className="w-4 h-4 text-purple-500 absolute right-4" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatsCard
            icon={<Users className="w-5 h-5" />}
            title="Total Subscribers"
            value={totalSubscribers.toLocaleString()}
            trend="up"
            color="purple"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <StatsCard
            icon={<Eye className="w-5 h-5" />}
            title="Total Views"
            value={(analytics?.totalViews ?? 0).toLocaleString()}
            trend="up"
            color="blue"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <StatsCard
            icon={<ThumbsUp className="w-5 h-5" />}
            title="Total Likes"
            value={(analytics?.totalLikes ?? 0).toLocaleString()}
            trend="up"
            color="green"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <StatsCard
            icon={<Percent className="w-5 h-5" />}
            title="Engagement Rate"
            value={`${(analytics?.engagementRate ?? 0).toFixed(2)}%`}
            trend="up"
            color="orange"
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

      {/* Charts Section */}
      {hasData && (
        <div className="grid gap-8 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-purple-500" />
                <h3 className="text-lg font-semibold text-gray-900">Top Performing Videos</h3>
              </div>
            </div>
            <div className="p-6">
              <TopVideosChart
                videos={analytics.analyticsData.slice(0, 5).map((video) => ({
                  title: video.title,
                  views: parseInt(video.views || '0'),
                }))}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <h3 className="text-lg font-semibold text-gray-900">AI Recommendations</h3>
              </div>
            </div>
            <div className="p-6">
              <Recommendations analytics={analytics || {}} />
            </div>
          </motion.div>
        </div>
      )}

      {/* Performance Chart */}
      {hasData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300"
        >
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-purple-500" />
              <h3 className="text-lg font-semibold text-gray-900">Performance Chart</h3>
            </div>
          </div>
          <div className="p-6">
            <PerformanceChart data={analytics.analyticsData} />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}