import React from 'react';
import { SEOAnalysis } from '../../types/seo';
import { SEOScoreIndicator } from './SEOScoreIndicator';
import { motion } from 'framer-motion';

interface SEOAnalysisPanelProps {
  analysis: SEOAnalysis;
}

export function SEOAnalysisPanel({ analysis }: SEOAnalysisPanelProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <SEOScoreIndicator score={analysis.score} size="lg" />
        <div>
          <h3 className="text-lg font-semibold">Overall SEO Score</h3>
          <p className="text-gray-600">Based on title, description, and tags analysis</p>
        </div>
      </div>

      <div className="grid gap-6">
        {[
          { title: 'Title Analysis', data: analysis.titleAnalysis },
          { title: 'Description Analysis', data: analysis.descriptionAnalysis },
          { title: 'Tags Analysis', data: analysis.tagsAnalysis }
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
              <SEOScoreIndicator score={section.data.score} size="sm" />
            </div>
            <ul className="space-y-2">
              {section.data.suggestions.map((suggestion, i) => (
                <li key={i} className="text-sm text-gray-600">• {suggestion}</li>
              ))}
            </ul>
          </motion.div>
        ))}

        {analysis.overallSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-blue-50 p-4 rounded-lg"
          >
            <h4 className="font-medium mb-3">Overall Recommendations</h4>
            <ul className="space-y-2">
              {analysis.overallSuggestions.map((suggestion, i) => (
                <li key={i} className="text-sm text-blue-600">• {suggestion}</li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    </div>
  );
}