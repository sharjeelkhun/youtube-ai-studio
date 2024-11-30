import { fetchWithAuth } from './api';

export interface AnalyticsData {
  viewsGrowth: number;
  subscriberGrowth: number;
  likesGrowth: number;
  videoGrowth: number;
  totalLikes: number;
  analyticsData: any[];
}

export function getMockAnalytics(): AnalyticsData {
  return {
    viewsGrowth: 12.5,
    subscriberGrowth: 8.3,
    likesGrowth: 15.7,
    videoGrowth: 5.2,
    totalLikes: 1250,
    analyticsData: []
  };
}