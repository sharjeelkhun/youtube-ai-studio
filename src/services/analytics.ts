import { VideoData } from '../types/youtube';

export interface AnalyticsData {
  viewsGrowth: number;
  subscriberGrowth: number;
  likesGrowth: number;
  videoGrowth: number;
  totalLikes: number;
  analyticsData: VideoData[];
}

function calculateGrowth(previous: number, current: number): number {
  if (previous === 0) return current > 0 ? 100 : 0; // Handle division by zero
  return ((current - previous) / previous) * 100;
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
      analyticsData: []
    };
  }

  try {
    // Parse time range
    const now = new Date();
    let rangeStart: Date;
    switch (timeRange) {
      case '1y':
        rangeStart = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case '6m':
        rangeStart = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
        break;
      case '3m':
        rangeStart = new Date(now.getTime() - 3 * 30 * 24 * 60 * 60 * 1000);
        break;
      case '1m':
        rangeStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        rangeStart = new Date(now.getTime() - 3 * 30 * 24 * 60 * 60 * 1000); // Default to 3 months
    }

    // Filter videos by time range
    const filteredVideos = videos.filter(
      (video) => new Date(video.uploadDate) >= rangeStart
    );

    // Debugging filtered videos
    console.log('Filtered Videos:', filteredVideos);

    // Sort videos by date
    const sortedVideos = [...filteredVideos].sort((a, b) =>
      new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    );

    // Calculate total likes
    const totalLikes = sortedVideos.reduce(
      (sum, video) => sum + parseInt(video.likes || '0'),
      0
    );

    // Calculate metrics for the filtered videos
    const currentViews = sortedVideos.reduce(
      (sum, video) => sum + parseInt(video.views || '0'),
      0
    );

    // Growth calculations remain the same
    const viewsGrowth = calculateGrowth(0, currentViews); // Adjust as needed
    const likesGrowth = calculateGrowth(0, totalLikes); // Adjust as needed
    const videoGrowth = calculateGrowth(0, sortedVideos.length); // Adjust as needed

    const subscriberGrowth = Math.min(
      Math.max(
        Number(
          ((viewsGrowth * 0.4) + (likesGrowth * 0.4) + (videoGrowth * 0.2)).toFixed(1)
        ),
        -100
      ),
      100
    );

    return {
      viewsGrowth,
      subscriberGrowth,
      likesGrowth,
      videoGrowth,
      totalLikes,
      analyticsData: sortedVideos
    };
  } catch (error) {
    console.error('Error calculating analytics:', error);
    throw error;
  }
}