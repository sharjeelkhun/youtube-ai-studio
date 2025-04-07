import React, { useState } from 'react';
import { VideoData } from '../types/youtube';
import { Edit2, Wand2, ExternalLink, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { SEOScoreIndicator } from './video/SEOScoreIndicator';
import { analyzeSEO } from '../services/seoService';
import { useAPIKeyStore } from '../store/apiKeyStore';
import { useSEOStore } from '../store/seoStore';
import { useQuery, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { SEOAnalysis } from '../types/seo';

// Constants for processing
const BATCH_SIZE = 5;
const DELAY_BETWEEN_BATCHES = 3000;
const MIN_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 10000;
const MAX_RETRIES = 3;

// Constants for score calculation
const BASE_SCORES = {
  TITLE_WEIGHT: 0.35,
  DESC_WEIGHT: 0.35,
  TAGS_WEIGHT: 0.3,
  MIN_SCORE: 30, // Lower minimum score
  MAX_SCORE: 98  // More realistic maximum
};

// Add validation helper
function validateResponse(response: any) {
  return response && 
         typeof response === 'object' &&
         !Array.isArray(response) &&
         Object.keys(response).length > 0;
}

interface VideoCardProps {
  video: VideoData;
  onEdit: () => void;
  onSuggestions: () => void;
}

export function VideoCard({ video, onEdit, onSuggestions }: VideoCardProps) {
  const { getKey } = useAPIKeyStore();
  const cohereKey = getKey('cohere');
  const queryClient = useQueryClient();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: seoScore, isLoading } = useQuery(
    ['seo-score', video.id],
    async () => {
      const storedScore = useSEOStore.getState().getScore(video.id);
      if (storedScore?.timestamp) {
        const scoreAge = Date.now() - storedScore.timestamp;
        if (scoreAge < 24 * 60 * 60 * 1000) {
          return storedScore.score;
        }
      }
      return null;
    },
    {
      staleTime: Infinity,
      cacheTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchInterval: false,
    }
  );

  const normalizeScore = (score: number | null | undefined): number => {
    if (score === null || score === undefined || isNaN(score)) return 50;
    return score < 1 ? score * 100 : score;
  };

  React.useEffect(() => {
    if (cohereKey) {
      queryClient.prefetchQuery(['seo-score', video.id]);
    }
  }, [cohereKey, video.id]);

  const handleAnalyzeSEO = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeSEO(video.title, video.description, video.tags);
      if (analysis) {
        await useSEOStore.getState().setScore(video.id, analysis);
        queryClient.setQueryData(['seo-score', video.id], analysis.score);
        toast.success('SEO Analysis completed!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to analyze SEO');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm overflow-hidden"
    >
      <div className="relative">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full aspect-video object-cover"
        />
        {!cohereKey ? (
          <div className="absolute top-2 right-2 bg-gray-100 rounded-lg px-3 py-1 text-sm text-gray-600">
            Configure AI in Settings
          </div>
        ) : isLoading ? (
          <div className="absolute top-2 right-2">
            <div className="animate-pulse backdrop-blur-sm p-1 rounded-full">
              <SEOScoreIndicator score={null} size="sm" />
            </div>
          </div>
        ) : seoScore ? (
          <div className="absolute top-2 right-2">
            <SEOScoreIndicator score={seoScore} size="sm" />
          </div>
        ) : (
          <motion.button
            onClick={handleAnalyzeSEO}
            disabled={isLoading}
            whileHover={!isLoading ? { scale: 1.05 } : {}}
            whileTap={!isLoading ? { scale: 0.95 } : {}}
            className="absolute top-2 right-2 bg-black/40 backdrop-blur-md border border-white/50 hover:bg-black/60 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1.5 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isLoading ? 'Analyzing...' : 'Analyze SEO'}
          </motion.button>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {video.title}
        </h3>

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <span>{format(new Date(video.uploadDate), 'MMM d, yyyy')}</span>
          <span>{parseInt(video.views).toLocaleString()} views</span>
          <span>{parseInt(video.likes).toLocaleString()} likes</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>

          <button
            onClick={onSuggestions}
            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Wand2 className="w-4 h-4" />
            Suggestions
          </button>

          <a
            href={`https://youtube.com/watch?v=${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors ml-auto"
          >
            <ExternalLink className="w-4 h-4" />
            View
          </a>
        </div>
      </div>
    </motion.div>
  );
}