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
  if (previous === 0) return current > 0 ? 100 : 0; // Handle division by zerots
  return ((current - previous) / previous) * 100;0; // Handle division by zero
} return ((current - previous) / previous) * 100;
}
function parseTimeRange(timeRange: string): number {
  switch (timeRange) {getChannelAnalytics(
    case '1y':
      return 365 * 24 * 60 * 60 * 1000;[],
    case '6m':
      return 6 * 30 * 24 * 60 * 60 * 1000;ata> {
    case '3m':
      return 3 * 30 * 24 * 60 * 60 * 1000; throw new Error('Access token is required');
    case '1m':  }
      return 30 * 24 * 60 * 60 * 1000;
    default:s.length) {
      return 3 * 30 * 24 * 60 * 60 * 1000; // Default to 3 months
  }
}h: 0,

export async function getChannelAnalytics(,
  accessToken: string,
  videos: VideoData[],analyticsData: []
  timeRange: string };
): Promise<AnalyticsData> {  }
  if (!accessToken) {
    throw new Error('Access token is required');
  }
);
  if (!videos.length) {;
    return {Range) {
      viewsGrowth: 0,
      subscriberGrowth: 0,tart = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      likesGrowth: 0,
      videoGrowth: 0,
      totalLikes: 0,tart = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
      analyticsData: []
    };
  }tart = new Date(now.getTime() - 3 * 30 * 24 * 60 * 60 * 1000);

  try {
    // Split videos into current and previous periodtart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const rangeStart = new Date(now.getTime() - parseTimeRange(timeRange));
    const previousRangeStart = new Date(rangeStart.getTime() - parseTimeRange(timeRange));   rangeStart = new Date(now.getTime() - 3 * 30 * 24 * 60 * 60 * 1000); // Default to 3 months
    }
    const currentPeriodVideos = videos.filter(
      (video) => new Date(video.uploadDate) >= rangeStart
    );
    const previousPeriodVideos = videos.filter((video) => new Date(video.uploadDate) >= rangeStart
      (video) => {    );
        const uploadDate = new Date(video.uploadDate);
        return uploadDate >= previousRangeStart && uploadDate < rangeStart;
      }    console.log('Filtered Videos:', filteredVideos);
    );

    // Debugging periods
    console.log('Current Period Videos:', currentPeriodVideos);new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    console.log('Previous Period Videos:', previousPeriodVideos);    );

    // Calculate metrics for both periods
    const currentViews = currentPeriodVideos.reduce(
      (sum, video) => sum + parseInt(video.views || '0'),sum, video) => sum + parseInt(video.likes || '0'),
      00
    );    );
    const previousViews = previousPeriodVideos.reduce(
      (sum, video) => sum + parseInt(video.views || '0'),eos
      0
    );sum, video) => sum + parseInt(video.views || '0'),
0
    const currentLikes = currentPeriodVideos.reduce(    );
      (sum, video) => sum + parseInt(video.likes || '0'), Replace with actual logic for previous views
      0
    );
    const previousLikes = previousPeriodVideos.reduce(
      (sum, video) => sum + parseInt(video.likes || '0'),      0
      0
    );ousLikes = 0; // Debugging: Replace with actual logic for previous likes

    // Debugging calculated metrics
    console.log('Current Views:', currentViews, 'Previous Views:', previousViews);e.log('Current Likes:', currentLikes, 'Previous Likes:', previousLikes);
    console.log('Current Likes:', currentLikes, 'Previous Likes:', previousLikes);
alculate growth percentages
    // Calculate growth percentages viewsGrowth = calculateGrowth(previousViews, currentViews);
    const viewsGrowth = calculateGrowth(previousViews, currentViews);nst likesGrowth = calculateGrowth(previousLikes, currentLikes);
    const likesGrowth = calculateGrowth(previousLikes, currentLikes);    const videoGrowth = calculateGrowth(0, sortedVideos.length); // Adjust as needed
    const videoGrowth = calculateGrowth(previousPeriodVideos.length, currentPeriodVideos.length);
rowth percentages
    // Debugging growth percentagesGrowth:', viewsGrowth);
    console.log('Views Growth:', viewsGrowth);ikes Growth:', likesGrowth);
    console.log('Likes Growth:', likesGrowth);ideo Growth:', videoGrowth);
    console.log('Video Growth:', videoGrowth);
.min(
    return {Math.max(
      viewsGrowth,
      subscriberGrowth: 0, // Replace with actual logic for subscriber growthideoGrowth * 0.2)).toFixed(1)
      likesGrowth,
      videoGrowth,     -100
      totalLikes: currentLikes,     ),







}  }    throw error;    console.error('Error calculating analytics:', error);  } catch (error) {    };      analyticsData: currentPeriodVideos      100
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