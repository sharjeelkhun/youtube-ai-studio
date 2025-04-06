import React from 'react';
import { SEOAnalysis, DEFAULT_SEO_ANALYSIS } from '../../types/seo';
import { SEOScoreIndicator } from './SEOScoreIndicator';
import { motion } from 'framer-motion';
import { Sparkles, Layout, Tags, LineChart, Image } from 'lucide-react';

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

  const sections = [
    {
      title: 'Title Analysis',
      icon: <Layout className="w-5 h-5" />,
      data: mergedAnalysis.titleAnalysis,
      color: 'bg-blue-50 border-blue-200'
    },
    {
      title: 'Description Analysis',
      icon: <Sparkles className="w-5 h-5" />,
      data: mergedAnalysis.descriptionAnalysis,
      color: 'bg-purple-50 border-purple-200'
    },
    {
      title: 'Tags Analysis',
      icon: <Tags className="w-5 h-5" />,
      data: mergedAnalysis.tagsAnalysis,
      color: 'bg-green-50 border-green-200'
    },
    {
      title: 'Viewer Engagement',
      icon: <LineChart className="w-5 h-5" />,
      data: {
        score: mergedAnalysis.score,
        suggestions: mergedAnalysis.overallSuggestions.filter(s => 
          s.toLowerCase().includes('engage') || 
          s.toLowerCase().includes('viewer') ||
          s.toLowerCase().includes('audience')
        )
      },
      color: 'bg-orange-50 border-orange-200'
    },
    {
      title: 'Thumbnail Design',
      icon: <Image className="w-5 h-5" />,
      data: {
        score: mergedAnalysis.score,
        suggestions: mergedAnalysis.overallSuggestions.filter(s => 
          s.toLowerCase().includes('thumbnail') || 
          s.toLowerCase().includes('visual') ||
          s.toLowerCase().includes('image')
        )
      },
      color: 'bg-pink-50 border-pink-200'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
        <SEOScoreIndicator score={mergedAnalysis.score} size="lg" />
        <div>
          <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Overall SEO Score
          </h3>
          <p className="text-gray-600">
            {mergedAnalysis.score === null 
              ? "Analysis in progress..." 
              : "Comprehensive analysis of your video's SEO performance"}
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {sections.map((section, index) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-lg border ${section.color}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {section.icon}
                <h4 className="font-semibold text-gray-800">{section.title}</h4>
              </div>
              <SEOScoreIndicator score={section.data.score || 0} size="sm" />
            </div>
            {section.data.suggestions.length > 0 ? (
              <ul className="space-y-2">
                {section.data.suggestions.map((suggestion, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-1.5">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">No suggestions available</p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}