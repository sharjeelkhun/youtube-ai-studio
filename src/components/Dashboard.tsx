import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { getChannelVideos } from '../services/youtube';
import { getChannelAnalytics } from '../services/analytics';
import { useQuery } from 'react-query';
import { Loader2 } from 'lucide-react';
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
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to YouTube AI Studio</h1>
        <p className="text-gray-600 mb-8">Sign in with your YouTube account to get started</p>
      </div>
    );
  }

  if (isLoadingVideos || isLoadingAnalytics) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
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
    <div className="space-y-6">
      {/* Time Range Filter */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Analytics Overview</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="border border-gray-300 rounded-md p-2"
        >
          <option value="lifetime">Lifetime</option>
          <option value="1y">Last 1 Year</option>
          <option value="6m">Last 6 Months</option>
          <option value="3m">Last 3 Months</option>
          <option value="1m">Last 1 Month</option>
          <option value="1w">Last Week</option>
        </select>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Total Subscribers"
          value={totalSubscribers.toLocaleString()}
          trend="neutral"
        />
        <StatsCard
          title="Total Views"
          value={(analytics?.totalViews ?? 0).toLocaleString()}
          trend="neutral"
        />
        <StatsCard
          title="Total Likes"
          value={(analytics?.totalLikes ?? 0).toLocaleString()}
          trend="neutral"
        />
        <StatsCard
          title="Engagement Rate"
          value={`${(analytics?.engagementRate ?? 0).toFixed(2)}%`}
          trend="neutral"
        />
      </div>

      {/* Fallback Message */}
      {!hasData && (
        <div className="text-center text-gray-500">
          <p>No uploads found for the selected time range. Please try a different range.</p>
        </div>
      )}

      {/* Analytics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Views Growth"
          value={
            hasData
              ? analytics.viewsGrowth >= 0
                ? `Up ${analytics.viewsGrowth.toFixed(2)}%`
                : `Down ${Math.abs(Number(analytics.viewsGrowth.toFixed(2)))}%`
              : 'No data'
          }
          trend={hasData ? (analytics.viewsGrowth >= 0 ? 'up' : 'down') : 'neutral'}
        />
        <StatsCard
          title="Subscriber Growth"
          value={
            hasData
              ? (analytics.subscriberGrowth ?? 0) >= 0
                ? `Up ${(analytics.subscriberGrowth ?? 0).toFixed(2)}%`
                : `Down ${Math.abs(Number((analytics.subscriberGrowth ?? 0).toFixed(2)))}%`
              : 'No data'
          }
          trend={hasData ? ((analytics.subscriberGrowth ?? 0) >= 0 ? 'up' : 'down') : 'neutral'}
        />
        <StatsCard
          title="Likes Growth"
          value={
            hasData
              ? analytics.likesGrowth >= 0
                ? `Up ${analytics.likesGrowth.toFixed(2)}%`
                : `Down ${Math.abs(Number(analytics.likesGrowth.toFixed(2)))}%`
              : 'No data'
          }
          trend={hasData ? (analytics.likesGrowth >= 0 ? 'up' : 'down') : 'neutral'}
        />
        <StatsCard
          title="Video Growth"
          value={
            hasData
              ? analytics.videoGrowth >= 0
                ? `Up ${analytics.videoGrowth.toFixed(2)}%`
                : `Down ${Math.abs(Number(analytics.videoGrowth.toFixed(2)))}%`
              : 'No data'
          }
          trend={hasData ? (analytics.videoGrowth >= 0 ? 'up' : 'down') : 'neutral'}
        />
      </div>

      {/* Top Videos Chart */}
      {hasData ? (
        <TopVideosChart
          videos={analytics.analyticsData.slice(0, 5).map((video) => ({
            title: video.title,
            views: parseInt(video.views || '0'),
          }))}
        />
      ) : (
        <div className="text-center text-gray-500">
          <p>No top videos to display.</p>
        </div>
      )}

      {/* Recommendations */}
      <Recommendations analytics={analytics || {}} />

      {/* Performance Chart */}
      {hasData ? (
        <PerformanceChart data={analytics.analyticsData} />
      ) : (
        <div className="text-center text-gray-500">
          <p>No performance data to display.</p>
        </div>
      )}
    </div>
  );
}