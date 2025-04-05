import React from 'react';
import { AlertCircle } from 'lucide-react';

interface SEOScoreIndicatorProps {
  score: number | null;
  size: 'sm' | 'md' | 'lg';
}

export function SEOScoreIndicator({ score, size }: SEOScoreIndicatorProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs font-medium',
    md: 'w-10 h-10 text-sm font-medium',
    lg: 'w-12 h-12 text-base font-medium',
  };

  if (score === null || score === undefined) {
    return (
      <div className={`flex items-center justify-center rounded-full bg-gray-300 text-white ${sizeClasses[size]}`}>
        <AlertCircle className="w-4 h-4" />
      </div>
    );
  }

  if (score < 0 || score > 100) {
    console.error('Invalid SEO score:', score);
    return null;
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full ${getScoreColor(score)} text-white ${sizeClasses[size]} shadow-sm`}
    >
      {score}%
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-green-600';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
}