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
      <div className={`flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-gray-400 ${sizeClasses[size]} shadow-sm`}>
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
      className={`flex items-center justify-center rounded-full ${getScoreColor(score)} backdrop-blur-md ${sizeClasses[size]} shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl border border-white/20`}
    >
      {score}%
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-green-500 text-white';
  if (score >= 60) return 'bg-yellow-500 text-white';
  return 'bg-red-500 text-white';
}