import React from 'react';
import { SEOAnalysis, DEFAULT_SEO_ANALYSIS } from '../../types/seo';
import { SEOScoreIndicator } from './SEOScoreIndicator';
import { motion } from 'framer-motion';
import { Sparkles, Layout, Tags, LineChart, Image, AlertCircle } from 'lucide-react';

interface SEOAnalysisPanelProps {
  analysis: SEOAnalysis | null;
}

interface SectionData {
  score: number;
  suggestions: string[];
}

interface Section {
  title: string;
  icon: React.ReactNode;
  data: SectionData;
  color: string;
}

export function SEOAnalysisPanel({ analysis }: SEOAnalysisPanelProps) {
  // Handle null analysis case
  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
        <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
        <p className="text-gray-600 text-center">No analysis available yet</p>
      </div>
    );
  }

  // Normalize and validate scores
  const normalizeScore = (score: number | null | undefined): number => {
    if (score === null || score === undefined || isNaN(score)) return 0;
    return Math.min(Math.max(Math.round(score), 0), 100);
  };

  const mergedAnalysis = {
    score: normalizeScore(analysis?.score),
    titleAnalysis: {
      score: normalizeScore(analysis?.titleAnalysis?.score),
      suggestions: analysis?.titleAnalysis?.suggestions ?? []
    },
    descriptionAnalysis: {
      score: normalizeScore(analysis?.descriptionAnalysis?.score),
      suggestions: analysis?.descriptionAnalysis?.suggestions ?? []
    },
    tagsAnalysis: {
      score: normalizeScore(analysis?.tagsAnalysis?.score),
      suggestions: analysis?.tagsAnalysis?.suggestions ?? []
    },
    overallSuggestions: analysis?.overallSuggestions ?? []
  };

  const filterSuggestions = (keywords: string[]): string[] => {
    return (mergedAnalysis.overallSuggestions || []).filter(s => 
      s && keywords.some(keyword => s.toLowerCase().includes(keyword))
    );
  };

  const sections: Section[] = [
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
        suggestions: filterSuggestions(['engage', 'viewer', 'audience'])
      },
      color: 'bg-orange-50 border-orange-200'
    },
    {
      title: 'Thumbnail Design',
      icon: <Image className="w-5 h-5" />,
      data: {
        score: mergedAnalysis.score,
        suggestions: filterSuggestions(['thumbnail', 'visual', 'image'])
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
            {mergedAnalysis.score === 0
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