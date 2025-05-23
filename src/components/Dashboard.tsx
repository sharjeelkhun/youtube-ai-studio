import React, { useState, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { getChannelVideos } from '../services/youtube';
import { getChannelAnalytics } from '../services/analytics';
import { useQuery } from 'react-query';
import { Loader2, ChevronDown, Eye, ThumbsUp, Star, MessageCircle, BarChart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { AreaChart } from '@tremor/react';
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
        className="flex flex-col items-center justify-center h-[calc(100vh-64px)] bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800"
      >
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 mb-4">
          Welcome to YouTube AI Studio
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg mb-8">Sign in with your YouTube account to get started</p>
      </motion.div>
    );
  }

  if (isLoadingVideos || isLoadingAnalytics) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <Loader2 className="w-12 h-12 animate-spin text-red-600 mb-4" />
        <p className="text-gray-600 dark:text-gray-300 animate-pulse">Loading your dashboard...</p>
      </div>
    );
  }

  if (videosError || analyticsError) {
    return (
      <div className="text-center text-red-500 dark:text-red-400">
        <p>Failed to load data. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button>Download</Button>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <option value="lifetime">Lifetime</option>
            <option value="1y">Last 1 Year</option>
            <option value="6m">Last 6 Months</option>
            <option value="3m">Last 3 Months</option>
            <option value="1m">Last 1 Month</option>
            <option value="1w">Last Week</option>
          </select>
        </div>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {processedAnalytics?.totalSubscribers.toLocaleString() ?? '0'}
                </div>
                <MetricsChange value={metrics?.subscriberGrowth} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {processedAnalytics?.totalViews.toLocaleString() ?? '0'}
                </div>
                <MetricsChange value={metrics?.viewsGrowth} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
                <ThumbsUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {processedAnalytics?.totalLikes.toLocaleString() ?? '0'}
                </div>
                <MetricsChange value={metrics?.likesGrowth} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {processedAnalytics?.engagementRate.toFixed(2) ?? '0.00'}%
                </div>
                <MetricsChange value={metrics?.engagementGrowth} />
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Views Over Time</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                {preparedData.chartData.length > 0 ? (
                  <AreaChart
                    className="h-[300px]"
                    data={preparedData.chartData}
                    index="date"
                    categories={["views", "likes"]}
                    colors={["blue", "rose"]}
                    valueFormatter={(value: number) => value.toLocaleString()}
                    showLegend
                    showGridLines={false}
                  />
                ) : (
                  <EmptyState message="No view data available" />
                )}
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Top Videos</CardTitle>
                <CardDescription>
                  Your best performing content
                </CardDescription>
              </CardHeader>
              <CardContent>
                {preparedData.topVideos.length > 0 ? (
                  <div className="space-y-8">
                    {preparedData.topVideos.map((video, index) => (
                      <div className="flex items-center" key={index}>
                        <div className="ml-4 space-y-1">
                          <p className="text-sm font-medium leading-none">{video.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {video.value.toLocaleString()} views
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No video data available" />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 grid-cols-1">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                  Detailed analytics of your channel
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="space-y-4">
                  {[
                    {
                      name: "Total Views",
                      value: processedAnalytics?.totalViews ?? 0,
                      color: "blue",
                      icon: <Eye className="w-4 h-4" />
                    },
                    {
                      name: "Total Likes",
                      value: processedAnalytics?.totalLikes ?? 0,
                      color: "green",
                      icon: <ThumbsUp className="w-4 h-4" />
                    },
                    {
                      name: "Comments",
                      value: preparedData.latestData?.comments ?? 0,
                      color: "violet",
                      icon: <MessageCircle className="w-4 h-4" />
                    },
                    {
                      name: "Engagement Rate",
                      value: processedAnalytics?.engagementRate ?? 0,
                      color: "amber",
                      icon: <Star className="w-4 h-4" />
                    }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/50 dark:bg-gray-900/50">
                      <div className={`p-2 rounded-lg bg-${item.color}-100 dark:bg-${item.color}-900/30 text-${item.color}-700 dark:text-${item.color}-400`}>
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{item.name}</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {item.value.toLocaleString()}
                          {item.name === "Engagement Rate" && "%"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const MetricsChange = ({ value }: { value: number | null | undefined }) => {
  if (value == null) return null;
  const isPositive = value >= 0;
  return (
    <span 
      className={`
        text-sm font-medium px-2.5 py-0.5 rounded-full
        ${isPositive 
          ? 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30' 
          : 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
        }
      `}
    >
      {isPositive ? '+' : ''}{value.toFixed(1)}%
    </span>
  );
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="h-72 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
    <div className="bg-gray-100 dark:bg-gray-700/30 p-3 rounded-full mb-3">
      <BarChart className="w-6 h-6" />
    </div>
    <p>{message}</p>
  </div>
);