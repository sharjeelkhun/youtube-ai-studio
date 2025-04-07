import React from 'react';
import { Lightbulb, Target } from 'lucide-react';
import { motion } from 'framer-motion';

export function Recommendations({ analytics }: { analytics: any }) {
  const recommendations = [];

  // Add recommendations based on views growth
  if (analytics.viewsGrowth < 0) {
    recommendations.push(
      `Views are down by ${Math.abs(analytics.viewsGrowth.toFixed(2))}%. Try posting more frequently and optimize your titles and thumbnails.`
    );
  } else if (analytics.viewsGrowth > 0) {
    recommendations.push(
      `Great job! Views are up by ${analytics.viewsGrowth.toFixed(2)}%. Keep creating similar content that resonates with your audience.`
    );
  }

  // Add recommendations based on likes growth
  if (analytics.likesGrowth < 0) {
    recommendations.push(
      `Likes are down by ${Math.abs(analytics.likesGrowth.toFixed(2))}%. Focus on engaging with your audience and ask viewers to like if they enjoy the content.`
    );
  } else if (analytics.likesGrowth > 0) {
    recommendations.push(
      `Excellent! Likes are up by ${analytics.likesGrowth.toFixed(2)}%. Your content is resonating well with viewers.`
    );
  }

  // Add engagement recommendations
  if (analytics.engagementRate < 5) {
    recommendations.push(
      'Try to boost engagement by adding clear calls-to-action and encouraging comments in your videos.'
    );
  } else if (analytics.engagementRate > 10) {
    recommendations.push(
      'Your engagement rate is strong! Consider creating more content around topics that drive this high engagement.'
    );
  }

  // Add general recommendations if we have data but no specific recommendations
  if (recommendations.length === 0 && analytics.analyticsData?.length > 0) {
    recommendations.push(
      'Your channel is maintaining steady performance. Consider experimenting with new content types or topics to drive growth.',
      'Regularly analyze your best-performing videos to understand what resonates with your audience.',
      'Keep your upload schedule consistent to maintain audience engagement.'
    );
  }

  return (
    <div className="space-y-4">
      {recommendations.map((rec, index) => (
        <div
          key={index}
          className="p-4 bg-gray-50 rounded-lg border text-sm text-gray-700"
        >
          <p>{rec}</p>
        </div>
      ))}
      {recommendations.length === 0 && (
        <div className="text-center p-6 bg-gray-50 rounded-lg">
          <Target className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Start creating content to see personalized recommendations</p>
        </div>
      )}
    </div>
  );
}
