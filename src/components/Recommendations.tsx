import React from 'react';
import { Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

export function Recommendations({ analytics }: { analytics: any }) {
  const recommendations = [];

  if (analytics.viewsGrowth < 0) {
    recommendations.push(
      `Views are down by ${Math.abs(analytics.viewsGrowth.toFixed(2))}%. Post more frequently to boost views.`
    );
  }
  if (analytics.likesGrowth < 0) {
    recommendations.push(
      `Likes are down by ${Math.abs(analytics.likesGrowth.toFixed(2))}%. Engage with your audience to increase likes.`
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-yellow-500" />
        <h2 className="text-lg font-semibold text-gray-900">Smart Recommendations</h2>
      </div>
      <div className="space-y-3">
        {recommendations.map((rec, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-100"
          >
            <p className="text-gray-800">{rec}</p>
          </motion.div>
        ))}
        {recommendations.length === 0 && (
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No recommendations available for this period.</p>
          </div>
        )}
      </div>
    </div>
  );
}
