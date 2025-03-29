import React from 'react';
import { useAuthStore } from '../store/authStore';
import { getChannelVideos } from '../services/youtube';
import { getChannelAnalytics } from '../services/analytics';
import { useQuery } from 'react-query';
import { Loader2 } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { PerformanceChart } from './PerformanceChart';

export function Dashboard() {
  const { accessToken, isAuthenticated } = useAuthStore();

  const { data: videos, isLoading: isLoadingVideos } = useQuery(
    ['videos', accessToken],
    () => getChannelVideos(accessToken!),
    {
      enabled: !!accessToken,
      staleTime: 5 * 60 * 1000,
    }
  );

  const { data: analytics, isLoading: isLoadingAnalytics } = useQuery(
    ['analytics', videos],
    () => getChannelAnalytics(accessToken!, videos!),
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

  if (!analytics) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Views Growth"
          value={analytics.viewsGrowth !== 0 ? `${analytics.viewsGrowth}%` : 'No Data'}
          trend={analytics.viewsGrowth > 0 ? 'up' : analytics.viewsGrowth < 0 ? 'down' : 'neutral'}
        />
        <StatsCard
          title="Subscriber Growth"
          value={analytics.subscriberGrowth !== 0 ? `${analytics.subscriberGrowth}%` : 'No Data'}
          trend={analytics.subscriberGrowth > 0 ? 'up' : analytics.subscriberGrowth < 0 ? 'down' : 'neutral'}
        />
        <StatsCard
          title="Likes Growth"
          value={analytics.likesGrowth !== 0 ? `${analytics.likesGrowth}%` : 'No Data'}
          trend={analytics.likesGrowth > 0 ? 'up' : analytics.likesGrowth < 0 ? 'down' : 'neutral'}
        />
        <StatsCard
          title="Video Growth"
          value={analytics.videoGrowth !== 0 ? `${analytics.videoGrowth}%` : 'No Data'}
          trend={analytics.videoGrowth > 0 ? 'up' : analytics.videoGrowth < 0 ? 'down' : 'neutral'}
        />
      </div>

      {analytics.analyticsData.length > 0 && (
        <PerformanceChart data={analytics.analyticsData} />
      )}
    </div>
  );
}