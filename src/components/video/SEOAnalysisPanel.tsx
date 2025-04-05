import React from 'react';
import { SEOAnalysis, DEFAULT_SEO_ANALYSIS } from '../../types/seo';
import { SEOScoreIndicator } from './SEOScoreIndicator';
import { motion } from 'framer-motion';

interface SEOAnalysisPanelProps {
  analysis: SEOAnalysis;
}

export function SEOAnalysisPanel({ analysis }: SEOAnalysisPanelProps) {
  if (!analysis) {
    return (
      <div className="text-center text-gray-500">
        <p>No analysis available yet</p>
      </div>
    );
  }

  // Convert decimal scores to percentages
  const formatScore = (score: number | null) => {
    if (score === null) return null;
    return Math.round(score * 100);
  };

  const mergedAnalysis = {
    ...DEFAULT_SEO_ANALYSIS,
    ...analysis,
    score: formatScore(analysis.score),
    titleAnalysis: {
      ...DEFAULT_SEO_ANALYSIS.titleAnalysis,
      ...analysis.titleAnalysis,
      score: formatScore(analysis.titleAnalysis?.score)
    },
    descriptionAnalysis: {
      ...DEFAULT_SEO_ANALYSIS.descriptionAnalysis,
      ...analysis.descriptionAnalysis,
      score: formatScore(analysis.descriptionAnalysis?.score)
    },
    tagsAnalysis: {
      ...DEFAULT_SEO_ANALYSIS.tagsAnalysis,
      ...analysis.tagsAnalysis,
      score: formatScore(analysis.tagsAnalysis?.score)
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <SEOScoreIndicator score={mergedAnalysis.score} size="lg" />
        <div>
          <h3 className="text-lg font-semibold">Overall SEO Score</h3>
          <p className="text-gray-600">
            {mergedAnalysis.score === null 
              ? "Score pending analysis" 
              : "Based on title, description, and tags analysis"}
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {[
          { title: 'Title Analysis', data: mergedAnalysis.titleAnalysis },
          { title: 'Description Analysis', data: mergedAnalysis.descriptionAnalysis },
          { title: 'Tags Analysis', data: mergedAnalysis.tagsAnalysis }
        ].map((section, index) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-50 p-4 rounded-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">{section.title}</h4>
              <SEOScoreIndicator score={section.data.score || 0} size="sm" />
            </div>
            <ul className="space-y-2">
              {section.data.suggestions.map((suggestion, i) => (
                <li key={i} className="text-sm text-gray-600">• {suggestion}</li>
              ))}
            </ul>
          </motion.div>
        ))}

        {mergedAnalysis.overallSuggestions?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-blue-50 p-4 rounded-lg"
          >
            <h4 className="font-medium mb-3">Overall Recommendations</h4>
            <ul className="space-y-2">
              {mergedAnalysis.overallSuggestions.map((suggestion, i) => (
                <li key={i} className="text-sm text-blue-600">• {suggestion}</li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    </div>
  );
}