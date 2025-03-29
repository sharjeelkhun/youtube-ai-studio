import React from 'react';
import { motion } from 'framer-motion';

interface SEOScoreIndicatorProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export function SEOScoreIndicator({ score, size = 'md' }: SEOScoreIndicatorProps) {
  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'w-8 h-8 text-xs';
      case 'lg': return 'w-16 h-16 text-xl';
      default: return 'w-12 h-12 text-base';
    }
  };

  const getColorClass = () => {
    if (score >= 80) return 'text-green-500 border-green-500';
    if (score >= 60) return 'text-orange-500 border-orange-500';
    return 'text-red-500 border-red-500';
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`${getSizeClass()} ${getColorClass()} 
        border-2 rounded-full flex items-center justify-center font-semibold`}
    >
      {score}
    </motion.div>
  );
}