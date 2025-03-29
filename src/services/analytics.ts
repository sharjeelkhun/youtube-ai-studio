import { VideoData } from '../types/youtube';

export interface AnalyticsData {
  viewsGrowth: number;
  subscriberGrowth: number;
  likesGrowth: number;
  videoGrowth: number;
  totalLikes: number;
  engagementRate: number; // New metric
  analyticsData: VideoData[];
}

function calculateGrowth(previous: number, current: number): number {
  if (previous === 0) return current > 0 ? 100 : 0; // Handle division by zero
  return ((current - previous) / previous) * 100;
}

function parseTimeRange(timeRange: string): number {
  switch (timeRange) {
    case '1y':
      return 365 * 24 * 60 * 60 * 1000;
    case '6m':
      return 6 * 30 * 24 * 60 * 60 * 1000;
    case '3m':
      return 3 * 30 * 24 * 60 * 60 * 1000;
    case '1m':
      return 30 * 24 * 60 * 60 * 1000;
    default:
      return 3 * 30 * 24 * 60 * 60 * 1000; // Default to 3 months
  }
}

export async function getChannelAnalytics(
  accessToken: string,
  videos: VideoData[],
  timeRange: string
): Promise<AnalyticsData> {
  if (!accessToken) {
    throw new Error('Access token is required');
  }

  if (!videos.length) {
    return {
      viewsGrowth: 0,
      subscriberGrowth: 0,
      likesGrowth: 0,
      videoGrowth: 0,
      totalLikes: 0,
      engagementRate: 0,
      analyticsData: []
    };
  }

  try {
    // Debugging input videos
    console.log('Input Videos:', videos);

    // Split videos into current and previous period
    const now = new Date();
    const rangeStart = new Date(now.getTime() - parseTimeRange(timeRange));
    const previousRangeStart = new Date(rangeStart.getTime() - parseTimeRange(timeRange));

    const currentPeriodVideos = videos.filter(
      (video) => new Date(video.uploadDate) >= rangeStart
    );
    const previousPeriodVideos = videos.filter((video) => {
      const uploadDate = new Date(video.uploadDate);
      return uploadDate >= previousRangeStart && uploadDate < rangeStart;
    });

    // Debugging periods
    console.log('Current Period Videos:', currentPeriodVideos);
    console.log('Previous Period Videos:', previousPeriodVideos);

    // Calculate metrics for both periods
    const currentViews = currentPeriodVideos.reduce(
      (sum, video) => sum + parseInt(video.views || '0'),
      0
    );
    const previousViews = previousPeriodVideos.reduce(
      (sum, video) => sum + parseInt(video.views || '0'),
      0
    );

    const currentLikes = currentPeriodVideos.reduce(
      (sum, video) => sum + parseInt(video.likes || '0'),
      0
    );
    const previousLikes = previousPeriodVideos.reduce(
      (sum, video) => sum + parseInt(video.likes || '0'),
      0
    );

    // Debugging calculated metrics
    console.log('Current Views:', currentViews, 'Previous Views:', previousViews);
    console.log('Current Likes:', currentLikes, 'Previous Likes:', previousLikes);

    // Calculate growth percentages
    const viewsGrowth = calculateGrowth(previousViews, currentViews);
    const likesGrowth = calculateGrowth(previousLikes, currentLikes);
    const videoGrowth = calculateGrowth(previousPeriodVideos.length, currentPeriodVideos.length);

    // Debugging growth percentages
    console.log('Views Growth:', viewsGrowth);
    console.log('Likes Growth:', likesGrowth);
    console.log('Video Growth:', videoGrowth);

    // Calculate engagement rate
    const totalViews = currentPeriodVideos.reduce(
      (sum, video) => sum + parseInt(video.views || '0'),
      0
    );
    const engagementRate = totalViews > 0 ? (currentLikes / totalViews) * 100 : 0;

    return {
      viewsGrowth,
      subscriberGrowth: 0, // Placeholder logic
      likesGrowth,
      videoGrowth,
      totalLikes: currentLikes,
      engagementRate,
      analyticsData: currentPeriodVideos
    };
  } catch (error) {
    console.error('Error calculating analytics:', error);
    throw error;
  }
}