import React, { useState, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { getChannelVideos } from '../services/youtube';
import { getChannelAnalytics } from '../services/analytics';
import { useQuery } from 'react-query';
import { Loader2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Title, AreaChart, DonutChart, BarList } from '@tremor/react';
import { safeNumber, safeDate, transformAnalyticsItem } from '../utils/dataTransforms';

interface AnalyticsData {
  date: string;
  title: string;
  views: number;
  likes: number;
  comments?: number;
  subscribers?: number;
  engagement?: number;
}

interface Analytics {
  analyticsData: AnalyticsData[];
  totalViews: number;
  totalLikes: number;
  totalSubscribers: number;
  engagementRate: number;
}

interface ChannelAnalyticsResponse {
  analyticsData: AnalyticsData[];
  totalViews: number;
  totalLikes: number;
  totalSubscribers: number;
  engagementRate: number;
}

// Add type guard
const isValidAnalytics = (data: any): data is ChannelAnalyticsResponse => {
  return data &&
    Array.isArray(data.analyticsData) &&
    typeof data.totalViews === 'number' &&
    typeof data.totalLikes === 'number' &&
    typeof data.totalSubscribers === 'number' &&
    typeof data.engagementRate === 'number';
};

// Add safe data filtering helper
const isValidDate = (date: string) => {
  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
};

export function Dashboard() {
  const { isAuthenticated, accessToken } = useAuthStore();
  const [timeRange, setTimeRange] = useState('3m');

  // Videos query with better error handling
  const { data: videos, isLoading: isLoadingVideos, error: videosError } = useQuery(
    ['videos'],
    async () => {
      try {
        if (!accessToken) throw new Error('Access token required');
        const response = await getChannelVideos(accessToken);
        if (!response?.length) {
          throw new Error('No video data received');
        }
        return response;
      } catch (error) {
        console.error('Videos fetch error:', error);
        throw error;
      }
    },
    {
      enabled: Boolean(accessToken),
      staleTime: 5 * 60 * 1000,
      retry: 2
    }
  );

  // Analytics query with better error handling
  const { data: analytics, isLoading: isLoadingAnalytics, error: analyticsError } = useQuery(
    ['analytics', timeRange],
    async () => {
      try {
        if (!accessToken) throw new Error('Access token required');
        if (!videos) throw new Error('Videos data required');
        
        const response = await getChannelAnalytics(accessToken, videos, timeRange);
        if (!response || !isValidAnalytics(response)) {
          throw new Error('Invalid analytics data structure');
        }
        return response;
      } catch (error) {
        console.error('Analytics fetch error:', error);
        throw error;
      }
    },
    {
      enabled: Boolean(accessToken && videos),
      staleTime: 30 * 60 * 1000,
      retry: 2
    }
  );

  // Process analytics with safe transformations
  const processedAnalytics = useMemo(() => {
    if (!analytics?.analyticsData) return null;
    
    return {
      totalViews: safeNumber(analytics.totalViews),
      totalLikes: safeNumber(analytics.totalLikes),
      totalSubscribers: safeNumber(analytics.totalSubscribers),
      engagementRate: safeNumber(analytics.engagementRate),
      analyticsData: analytics.analyticsData.map(transformAnalyticsItem)
    };
  }, [analytics]);

  // Update preparedData memo with better error handling
  const preparedData = useMemo(() => {
    if (!processedAnalytics?.analyticsData?.length) {
      return {
        chartData: [],
        topVideos: [],
        latestData: null,
        previousData: null
      };
    }

    try {
      // Filter and sort data more safely
      const sortedData = [...processedAnalytics.analyticsData]
        .filter(item => item.date && isValidDate(item.date))
        .sort((a, b) => {
          if (!a.date || !b.date) return 0;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        })
        .map(item => ({
          ...item,
          views: safeNumber(item.views),
          likes: safeNumber(item.likes),
          comments: safeNumber(item.comments),
          subscribers: safeNumber(item.subscribers),
          engagement: safeNumber(item.engagement),
          date: new Date(item.date).toISOString()
        }));

      if (!sortedData.length) {
        throw new Error('No valid data after filtering');
      }

      return {
        chartData: [...sortedData].reverse().map(item => ({
          date: item.date,
          views: item.views,
          likes: item.likes
        })),
        topVideos: sortedData.slice(0, 5).map(item => ({
          name: item.title || 'Untitled',
          value: item.views
        })),
        latestData: sortedData[0],
        previousData: sortedData[1] || sortedData[0] // Fallback to latest if no previous
      };
    } catch (error) {
      console.error('Error preparing chart data:', error);
      return {
        chartData: [],
        topVideos: [],
        latestData: null,
        previousData: null
      };
    }
  }, [processedAnalytics]);

  // Calculate metrics with null safety
  const metrics = useMemo(() => {
    const { latestData, previousData } = preparedData;
    if (!latestData || !previousData) return null;

    const calculateChange = (current: number | undefined, previous: number | undefined): number => {
      const curr = Number(current) || 0;
      const prev = Number(previous) || 0;
      if (!prev) return 0;
      
      const change = ((curr - prev) / prev) * 100;
      return Number.isFinite(change) ? Number(change.toFixed(1)) : 0;
    };

    return {
      subscriberGrowth: calculateChange(latestData.subscribers, previousData.subscribers),
      viewsGrowth: calculateChange(latestData.views, previousData.views),
      likesGrowth: calculateChange(latestData.likes, previousData.likes),
      engagementGrowth: calculateChange(latestData.engagement, previousData.engagement)
    };
  }, [preparedData]);

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

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
            Analytics Overview
          </h1>
          <p className="text-gray-600 mt-1">Track and optimize your channel's performance</p>
        </div>

        <Card className="w-full md:w-auto bg-white/50 backdrop-blur-sm border border-gray-100">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="w-full appearance-none bg-transparent px-4 py-2 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="lifetime">Lifetime</option>
            <option value="1y">Last 1 Year</option>
            <option value="6m">Last 6 Months</option>
            <option value="3m">Last 3 Months</option>
            <option value="1m">Last 1 Month</option>
            <option value="1w">Last Week</option>
          </select>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card 
            decoration="top" 
            decorationColor="indigo"
            className="bg-gradient-to-br from-white to-indigo-50/50 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Title>Total Subscribers</Title>
            <div className="flex items-baseline space-x-2 mt-4">
              <span className="text-tremor-metric font-semibold">
                {processedAnalytics?.totalSubscribers.toLocaleString() ?? '0'}
              </span>
              <MetricsChange value={metrics?.subscriberGrowth} />
            </div>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card 
            decoration="top" 
            decorationColor="blue"
            className="bg-gradient-to-br from-white to-blue-50/50 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Title>Total Views</Title>
            <div className="flex items-baseline space-x-2 mt-4">
              <span className="text-tremor-metric font-semibold">
                {processedAnalytics?.totalViews.toLocaleString() ?? '0'}
              </span>
              <MetricsChange value={metrics?.viewsGrowth} />
            </div>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card 
            decoration="top" 
            decorationColor="green"
            className="bg-gradient-to-br from-white to-green-50/50 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Title>Total Likes</Title>
            <div className="flex items-baseline space-x-2 mt-4">
              <span className="text-tremor-metric font-semibold">
                {processedAnalytics?.totalLikes.toLocaleString() ?? '0'}
              </span>
              <MetricsChange value={metrics?.likesGrowth} />
            </div>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card 
            decoration="top" 
            decorationColor="orange"
            className="bg-gradient-to-br from-white to-orange-50/50 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Title>Engagement Rate</Title>
            <div className="flex items-baseline space-x-2 mt-4">
              <span className="text-tremor-metric font-semibold">
                {processedAnalytics?.engagementRate.toFixed(2) ?? '0.00'}%
              </span>
              <MetricsChange value={metrics?.engagementGrowth} />
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-white backdrop-blur-sm border border-gray-100/50 shadow-xl">
          <Title className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Views Over Time
          </Title>
          {preparedData.chartData.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mt-6"
            >
              <AreaChart
                className="h-80 mt-4"
                data={preparedData.chartData}
                index="date"
                categories={["views", "likes"]}
                colors={["indigo", "green"]}
                valueFormatter={(value: number) => value.toLocaleString()}
                showLegend
                showGridLines={false}
                startEndOnly={true}
              />
            </motion.div>
          ) : (
            <EmptyState message="No view data available" />
          )}
        </Card>

        <Card className="bg-white backdrop-blur-sm border border-gray-100/50 shadow-xl">
          <Title className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-pink-600">
            Top Videos
          </Title>
          {preparedData.topVideos.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mt-6"
            >
              <DonutChart
                className="h-80 mt-4"
                data={preparedData.topVideos}
                category="value"
                index="name"
                valueFormatter={(value: number) => `${value.toLocaleString()} views`}
                colors={["slate", "violet", "indigo", "rose", "cyan"]}
              />
            </motion.div>
          ) : (
            <EmptyState message="No video data available" />
          )}
        </Card>
      </div>

      <Card className="bg-white backdrop-blur-sm border border-gray-100/50 shadow-xl">
        <Title className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-teal-600">
          Performance Metrics
        </Title>
        <BarList
          data={[
            { 
              name: "Views", 
              value: processedAnalytics?.totalViews ?? 0,
              color: "indigo"
            },
            { 
              name: "Likes", 
              value: processedAnalytics?.totalLikes ?? 0,
              color: "green"
            },
            { 
              name: "Comments", 
              value: preparedData.latestData?.comments ?? 0,
              color: "orange"
            }
          ]}
          valueFormatter={(value: number) => value.toLocaleString()}
          className="mt-4"
        />
      </Card>
    </div>
  );
}

const MetricsChange = ({ value }: { value: number | null | undefined }) => {
  if (value == null) return null;
  const isPositive = value >= 0;
  return (
    <span className={`text-tremor-default ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
      {isPositive ? '+' : ''}{value}%
    </span>
  );
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="h-72 flex items-center justify-center text-gray-500">
    <p>{message}</p>
  </div>
);