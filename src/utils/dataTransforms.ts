import { AnalyticsData } from '../types/analytics';

export const safeNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return !isNaN(num) ? num : 0;
};

export const safeDate = (date: any): string => {
  if (!date) return new Date().toISOString();
  try {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime()) ? parsed.toISOString() : new Date().toISOString();
  } catch {
    return new Date().toISOString();
  }
};

export const transformAnalyticsItem = (item: Partial<AnalyticsData>): AnalyticsData => ({
  date: safeDate(item.date),
  title: item.title || '',
  views: safeNumber(item.views),
  likes: safeNumber(item.likes),
  comments: safeNumber(item.comments),
  subscribers: safeNumber(item.subscribers),
  engagement: safeNumber(item.engagement)
});
