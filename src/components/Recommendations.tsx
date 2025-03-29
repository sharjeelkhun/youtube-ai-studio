import React from 'react';

export function Recommendations({ analytics }: { analytics: any }) {
  const recommendations = [];

  if (analytics.viewsGrowth < 0) {
    recommendations.push('Consider posting more frequently to boost views.');
  }
  if (analytics.likesGrowth < 0) {
    recommendations.push('Engage with your audience to increase likes.');
  }

  return (
    <div className="p-4 bg-gray-100 rounded-md">
      <h2 className="text-lg font-bold mb-2">Recommendations</h2>
      <ul className="list-disc pl-5">
        {recommendations.map((rec, index) => (
          <li key={index}>{rec}</li>
        ))}
      </ul>
    </div>
  );
}
