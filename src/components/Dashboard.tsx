import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { getChannelVideos } from '../services/youtube';
import { getChannelAnalytics } from '../services/analytics';
import { useQuery } from 'react-query';
import { Loader2, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, Title, AreaChart, DonutChart, BarList } from '@tremor/react';

interface AnalyticsData {
  date: string;
  title: string;
  views: number;
  likes: number;
  comments: number;
  subscribers: number;
  engagement: number;
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

  const { data: analytics, isLoading: isLoadingAnalytics, error: analyticsError } = useQuery<ChannelAnalyticsResponse>(
    ['analytics', videos, timeRange],
    async () => {
      try {
        if (!accessToken || !videos) {
          throw new Error('Missing required data');
        }
        const response = await getChannelAnalytics(accessToken, videos, timeRange);
        if (!isValidAnalytics(response)) {
          throw new Error('Invalid analytics data format');
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
      cacheTime: 60 * 60 * 1000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  );

  const processedAnalytics = React.useMemo(() => {
    if (!analytics || !isValidAnalytics(analytics)) return null;
    
    const { totalViews, totalLikes, totalSubscribers, engagementRate, analyticsData } = analytics;
    
    return {
      totalViews,
      totalLikes,
      totalSubscribers,
      engagementRate,
      analyticsData: analyticsData.map(item => ({
        ...item,
        views: item.views || 0,
        likes: item.likes || 0,
        comments: item.comments || 0,
        subscribers: item.subscribers || 0,
        engagement: item.engagement || 0
      }))
    };
  }, [analytics]);

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

  const preparedData = React.useMemo(() => {
    const data = processedAnalytics?.analyticsData ?? [];
    
    if (!data.length) {
      return {
        chartData: [],
        topVideos: [],
        latestData: null,
        previousData: null
      };
    }

    const sortedData = [...data].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return {
      chartData: sortedData.map(item => ({
        date: new Date(item.date).toLocaleDateString(),
        views: item.views ?? 0,
        likes: item.likes ?? 0
      })).reverse(),
      topVideos: sortedData
        .slice(0, 5)
        .map(item => ({
          name: item.title || 'Untitled',
          value: item.views ?? 0
        })),
      latestData: sortedData[0] ?? null,
      previousData: sortedData[1] ?? null
    };
  }, [processedAnalytics]);

  const metrics = React.useMemo(() => {
    const { latestData, previousData } = preparedData;
    if (!latestData || !previousData) return null;

    const calculateChange = (current: number, previous: number) => {
      if (!previous) return 0;
      const change = ((current - previous) / previous) * 100;
      return Number.isFinite(change) ? Number(change.toFixed(1)) : 0;
    };

    return {
      subscriberGrowth: calculateChange(
        latestData.subscribers ?? 0,
        previousData.subscribers ?? 0
      ),
      viewsGrowth: calculateChange(
        latestData.views ?? 0,
        previousData.views ?? 0
      ),
      likesGrowth: calculateChange(
        latestData.likes ?? 0,
        previousData.likes ?? 0
      ),
      engagementGrowth: calculateChange(
        latestData.engagement ?? 0,
        previousData.engagement ?? 0
      )
    };
  }, [preparedData]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics Overview</h1>
          <p className="text-muted-foreground">Track and optimize your channel's performance</p>
        </div>

        <Card className="w-full md:w-auto">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="w-full appearance-none bg-background px-4 py-2 rounded-tremor-default text-tremor-default focus:outline-none focus:ring-2 focus:ring-tremor-brand-emphasis"
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card decoration="top" decorationColor="indigo">
          <Title>Total Subscribers</Title>
          <div className="flex items-baseline space-x-2 mt-4">
            <span className="text-tremor-metric font-semibold">
              {processedAnalytics?.totalSubscribers.toLocaleString() ?? '0'}
            </span>
            <MetricsChange value={metrics?.subscriberGrowth} />
          </div>
        </Card>
        <Card decoration="top" decorationColor="blue">
          <Title>Total Views</Title>
          <div className="flex items-baseline space-x-2 mt-4">
            <span className="text-tremor-metric font-semibold">
              {processedAnalytics?.totalViews.toLocaleString() ?? '0'}
            </span>
            <MetricsChange value={metrics?.viewsGrowth} />
          </div>
        </Card>
        <Card decoration="top" decorationColor="green">
          <Title>Total Likes</Title>
          <div className="flex items-baseline space-x-2 mt-4">
            <span className="text-tremor-metric font-semibold">
              {processedAnalytics?.totalLikes.toLocaleString() ?? '0'}
            </span>
            <MetricsChange value={metrics?.likesGrowth} />
          </div>
        </Card>
        <Card decoration="top" decorationColor="orange">
          <Title>Engagement Rate</Title>
          <div className="flex items-baseline space-x-2 mt-4">
            <span className="text-tremor-metric font-semibold">
              {processedAnalytics?.engagementRate.toFixed(2) ?? '0.00'}%
            </span>
            <MetricsChange value={metrics?.engagementGrowth} />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <Title>Views Over Time</Title>
          {preparedData.chartData.length > 0 ? (
            <AreaChart
              className="h-72 mt-4"
              data={preparedData.chartData}
              index="date"
              categories={["views", "likes"]}
              colors={["indigo", "green"]}
              valueFormatter={(value: number) => value.toLocaleString()}
              showLegend
            />
          ) : (
            <EmptyState message="No view data available" />
          )}
        </Card>

        <Card>
          <Title>Top Videos</Title>
          {preparedData.topVideos.length > 0 ? (
            <DonutChart
              className="h-72 mt-4"
              data={preparedData.topVideos}
              category="value"
              index="name"
              valueFormatter={(value: number) => `${value.toLocaleString()} views`}
              colors={["slate", "violet", "indigo", "rose", "cyan"]}
            />
          ) : (
            <EmptyState message="No video data available" />
          )}
        </Card>
      </div>

      <Card>
        <Title>Performance Metrics</Title>
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