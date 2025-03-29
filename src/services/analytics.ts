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

export async function getChannelAnalytics(accessToken: string, videos: VideoData[]): Promise<AnalyticsData> {
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
    // Debugging input data
    console.log('Videos:', videos);

    // Sort videos by date
    const sortedVideos = [...videos].sort((a, b) => 
      new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    );

    // Debugging sorted videos
    console.log('Sorted Videos:', sortedVideos);

    // Calculate total likes
    const totalLikes = sortedVideos.reduce((sum, video) => 
      sum + parseInt(video.likes || '0'), 0
    );

    // Split videos into current and previous period (30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));

    const currentPeriodVideos = sortedVideos.filter(
      video => new Date(video.uploadDate) >= thirtyDaysAgo
    );
    const previousPeriodVideos = sortedVideos.filter(
      video => {
        const uploadDate = new Date(video.uploadDate);
        return uploadDate >= sixtyDaysAgo && uploadDate < thirtyDaysAgo;
      }
    );

    // Debugging periods
    console.log('Current Period Videos:', currentPeriodVideos);
    console.log('Previous Period Videos:', previousPeriodVideos);

    // Calculate metrics for both periods
    const currentViews = currentPeriodVideos.reduce((sum, video) => 
      sum + parseInt(video.views || '0'), 0
    );
    const previousViews = previousPeriodVideos.reduce((sum, video) => 
      sum + parseInt(video.views || '0'), 0
    );

    const currentLikes = currentPeriodVideos.reduce((sum, video) => 
      sum + parseInt(video.likes || '0'), 0
    );
    const previousLikes = previousPeriodVideos.reduce((sum, video) => 
      sum + parseInt(video.likes || '0'), 0
    );

    // Debugging calculated metrics
    console.log('Current Views:', currentViews, 'Previous Views:', previousViews);
    console.log('Current Likes:', currentLikes, 'Previous Likes:', previousLikes);

    // Calculate growth percentages
    const viewsGrowth = calculateGrowth(previousViews, currentViews);
    const likesGrowth = calculateGrowth(previousLikes, currentLikes);
    const videoGrowth = calculateGrowth(
      previousPeriodVideos.length,
      currentPeriodVideos.length
    );

    // Estimate subscriber growth based on engagement metrics
    const subscriberGrowth = Math.min(
      Math.max(
        Number((
          (viewsGrowth * 0.4) + 
          (likesGrowth * 0.4) + 
          (videoGrowth * 0.2)
        ).toFixed(1)),
        -100
      ),
      100
    );

    // Debugging growth percentages
    console.log('Views Growth:', viewsGrowth);
    console.log('Likes Growth:', likesGrowth);
    console.log('Video Growth:', videoGrowth);
    console.log('Subscriber Growth:', subscriberGrowth);

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