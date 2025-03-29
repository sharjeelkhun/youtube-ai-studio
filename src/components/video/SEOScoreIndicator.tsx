import React from 'react';

interface SEOScoreIndicatorProps {
  score: number;
  size: 'sm' | 'md' | 'lg';
}

export function SEOScoreIndicator({ score, size }: SEOScoreIndicatorProps) {
  if (typeof score !== 'number' || score < 0 || score > 100) {
    console.error('Invalid SEO score:', score);
    return null; // Render nothing if the score is invalid
  }

  const sizeClasses = {
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-base',
    lg: 'w-10 h-10 text-lg',
  };

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-green-500 text-white ${sizeClasses[size]}`}
    >
      {score}%
    </div>
  );
}