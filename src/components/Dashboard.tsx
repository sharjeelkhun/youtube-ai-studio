import React from 'react';
import { TrendingUp, Users, Eye, ThumbsUp, ArrowUpRight, ArrowDown } from 'lucide-react';
import { VideoCard } from './VideoCard';
import { StatsCard } from './StatsCard';
import { PerformanceChart } from './PerformanceChart';
import { useQuery } from 'react-query';
import { getChannelVideos, getChannelStats, getChannelAnalytics } from '../services/youtube';
import { useAuthStore } from '../store/authStore';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export function Dashboard() {
  const { accessToken } = useAuthStore();
  
  const { data: videos, isLoading: videosLoading, error: videosError } = useQuery(
    ['videos', accessToken],
    () => getChannelVideos(accessToken!),
    {
      enabled: !!accessToken,
      staleTime: 5 * 60 * 1000,
      retry: 1,
      onError: (error: any) => {
        console.error('Failed to fetch videos:', error);
        toast.error('Failed to fetch videos from YouTube');
      }
    }
  );

  const { data: channelStats, isLoading: statsLoading, error: statsError } = useQuery(
    ['channelStats', accessToken],
    () => getChannelStats(accessToken!),
    {
      enabled: !!accessToken,
      staleTime: 5 * 60 * 1000,
      retry: 1,
      onError: (error: any) => {
        console.error('Failed to fetch channel stats:', error);
        toast.error('Failed to fetch channel statistics');
      }
    }
  );

  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useQuery(
    ['analytics', accessToken],
    () => getChannelAnalytics(accessToken!),
    {
      enabled: !!accessToken,
      staleTime: 5 * 60 * 1000,
      retry: 1,
      onError: (error: any) => {
        console.error('Failed to fetch analytics:', error);
        toast.error('Failed to fetch channel analytics');
      }
    }
  );

  const handleConnectYouTube = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      toast.error('Google Client ID is not configured');
      return;
    }

    const redirectUri = 'https://youtube-ai-studio.netlify.app';
    const scope = [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.force-ssl'
    ].join(' ');

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'token');
    authUrl.searchParams.append('scope', scope);
    authUrl.searchParams.append('include_granted_scopes', 'true');
    authUrl.searchParams.append('prompt', 'consent');

    window.location.href = authUrl.toString();
  };

  if (!accessToken) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex justify-center mb-6">
            <img 
              src="https://www.youtube.com/s/desktop/7c155e84/img/favicon_144x144.png"
              alt="YouTube Logo"
              className="w-16 h-16"
            />
          </div>
          <h2 className="text-3xl font-bold mb-4">Welcome to YouTube AI Studio</h2>
          <p className="text-gray-600 mb-8 text-lg">Sign in with your YouTube account to access detailed analytics</p>
          <button 
            onClick={handleConnectYouTube}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-lg font-medium mx-auto"
          >
            <img 
              src="https://www.youtube.com/s/desktop/7c155e84/img/favicon_32x32.png"
              alt="YouTube Icon"
              className="w-5 h-5"
            />
            Connect YouTube Account
          </button>
        </motion.div>
      </div>
    );
  }

  if (videosLoading || statsLoading || analyticsLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (videosError || statsError || analyticsError) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load data from YouTube</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    {
      icon: Eye,
      label: 'Total Views',
      value: channelStats?.viewCount ? parseInt(channelStats.viewCount).toLocaleString() : '0',
      trend: analytics?.viewsGrowth > 0 ? `+${analytics.viewsGrowth}%` : `${analytics.viewsGrowth}%`,
      trendIcon: analytics?.viewsGrowth > 0 ? ArrowUpRight : ArrowDown,
      trendColor: analytics?.viewsGrowth > 0 ? 'text-green-500' : 'text-red-500'
    },
    {
      icon: Users,
      label: 'Subscribers',
      value: channelStats?.subscriberCount ? parseInt(channelStats.subscriberCount).toLocaleString() : '0',
      trend: analytics?.subscriberGrowth > 0 ? `+${analytics.subscriberGrowth}%` : `${analytics.subscriberGrowth}%`,
      trendIcon: analytics?.subscriberGrowth > 0 ? ArrowUpRight : ArrowDown,
      trendColor: analytics?.subscriberGrowth > 0 ? 'text-green-500' : 'text-red-500'
    },
    {
      icon: ThumbsUp,
      label: 'Total Likes',
      value: analytics?.totalLikes.toLocaleString() || '0',
      trend: analytics?.likesGrowth > 0 ? `+${analytics.likesGrowth}%` : `${analytics.likesGrowth}%`,
      trendIcon: analytics?.likesGrowth > 0 ? ArrowUpRight : ArrowDown,
      trendColor: analytics?.likesGrowth > 0 ? 'text-green-500' : 'text-red-500'
    },
    {
      icon: TrendingUp,
      label: 'Videos',
      value: channelStats?.videoCount ? parseInt(channelStats.videoCount).toLocaleString() : '0',
      trend: analytics?.videoGrowth > 0 ? `+${analytics.videoGrowth}%` : `${analytics.videoGrowth}%`,
      trendIcon: analytics?.videoGrowth > 0 ? ArrowUpRight : ArrowDown,
      trendColor: analytics?.videoGrowth > 0 ? 'text-green-500' : 'text-red-500'
    },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 py-8"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Channel Overview</h1>
        <p className="text-gray-600 mt-2">Track your channel's performance and growth</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <PerformanceChart data={videos || []} analytics={analytics} />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Top Performing Videos</h3>
          {videos?.slice(0, 5).map((video) => (
            <div key={video.id} className="flex items-center gap-4 mb-4">
              <img 
                src={video.thumbnail} 
                alt={video.title} 
                className="w-20 h-12 object-cover rounded"
              />
              <div>
                <p className="font-medium text-sm line-clamp-1">{video.title}</p>
                <p className="text-sm text-gray-600">{parseInt(video.views).toLocaleString()} views</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Recent Videos</h2>
          <button 
            onClick={() => window.location.href = '/editor'}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Create New Thumbnail
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos?.map((video) => (
            <VideoCard key={video.id} {...video} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}