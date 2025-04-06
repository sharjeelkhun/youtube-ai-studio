import React from 'react';
import { AlertCircle } from 'lucide-react';

interface SEOScoreIndicatorProps {
  score: number | null;
  size: 'sm' | 'md' | 'lg';
}

export function SEOScoreIndicator({ score, size }: SEOScoreIndicatorProps) {
  const sizeClasses = {
    sm: 'w-10 h-10 text-xs font-bold',
    md: 'w-12 h-12 text-sm font-bold',
    lg: 'w-16 h-16 text-lg font-bold',
  };

  if (score === null || score === undefined) {
    return (
      <div className={`flex items-center justify-center rounded-full bg-gray-200 text-gray-500 ${sizeClasses[size]} shadow-sm`}>
        <AlertCircle className="w-5 h-5" />
      </div>
    );
  }

  if (score < 0 || score > 100) {
    console.error('Invalid SEO score:', score);
    return null;
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full ${getScoreColor(score)} text-white ${sizeClasses[size]} shadow-md transition-all duration-300 hover:scale-105`}
    >
      {score}%
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-gradient-to-br from-green-500 to-green-600';
  if (score >= 60) return 'bg-gradient-to-br from-yellow-500 to-yellow-600';
  return 'bg-gradient-to-br from-red-500 to-red-600';
}