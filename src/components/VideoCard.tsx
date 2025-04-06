import React from 'react';
import { VideoData } from '../types/youtube';
import { Edit2, Wand2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { SEOScoreIndicator } from './video/SEOScoreIndicator';
import { throttledAnalyzeSEO } from '../services/ai';
import { parseSEOAnalysis } from '../services/seoAnalysis';
import { useAPIKeyStore } from '../store/apiKeyStore';
import { useSEOStore } from '../store/seoStore';
import { useQuery, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';

// Constants for score calculation
const BATCH_SIZE = 5;
const DELAY_BETWEEN_BATCHES = 3000;
const BASE_SCORES = {
  TITLE_WEIGHT: 0.4,
  DESC_WEIGHT: 0.4,
  TAGS_WEIGHT: 0.2,
  MIN_SCORE: 65, // Minimum base score
  MAX_SCORE: 95  // Maximum base score
};

interface VideoCardProps {
  video: VideoData;
  onEdit: () => void;
  onSuggestions: () => void;
}

export function VideoCard({ video, onEdit, onSuggestions }: VideoCardProps) {
  const { getKey } = useAPIKeyStore();
  const cohereKey = getKey('cohere');
  const queryClient = useQueryClient();
  const storedScore = useSEOStore((state) => state.getScore(video.id));
  const retryCountRef = React.useRef(0);
  const batchIndex = React.useRef(Math.floor(Math.random() * BATCH_SIZE));

  const calculateVideoScore = (data: any): number => {
    if (!data) return BASE_SCORES.MIN_SCORE;

    // Calculate weighted score based on content
    let score = BASE_SCORES.MIN_SCORE;

    // Title factors
    if (video.title.length >= 40 && video.title.length <= 70) score += 10;
    if (/^[A-Z]/.test(video.title)) score += 5; // Starts with capital
    if (video.title.includes('|') || video.title.includes('-') || video.title.includes(':')) score += 5;

    // Description factors
    if (video.description.length >= 100) score += 10;
    if (video.description.includes('\n')) score += 5; // Has formatting

    // Tags factors
    if (video.tags.length >= 5) score += 5;
    if (video.tags.length >= 10) score += 5;

    // Normalize score
    return Math.min(Math.max(Math.round(score), BASE_SCORES.MIN_SCORE), BASE_SCORES.MAX_SCORE);
  };

  const { data: seoScore, isLoading } = useQuery(
    ['seo-score', video.id],
    async () => {
      if (!cohereKey) return null;
      
      // Return stored score if valid
      if (storedScore && typeof storedScore.score === 'number') {
        return calculateVideoScore(storedScore);
      }

      try {
        // Add delay between batches
        const batchDelay = (batchIndex.current * DELAY_BETWEEN_BATCHES) / BATCH_SIZE;
        await new Promise(resolve => setTimeout(resolve, batchDelay));

        const rawResponse = await throttledAnalyzeSEO(video.title, video.description, video.tags);
        const parsedResponse = typeof rawResponse === 'string' ? 
          parseSEOAnalysis(rawResponse) : rawResponse;

        if (parsedResponse) {
          const score = calculateVideoScore(parsedResponse);
          const analysisWithScore = {
            ...parsedResponse,
            score: score / 100
          };
          
          useSEOStore.getState().setScore(video.id, analysisWithScore);
          return score;
        }
      } catch (error: any) {
        console.error('Error calculating SEO score:', error);
        // Return default score on error
        return BASE_SCORES.MIN_SCORE;
      }
      return BASE_SCORES.MIN_SCORE;
    },
    {
      enabled: !!cohereKey,
      staleTime: 24 * 60 * 60 * 1000,
      cacheTime: Infinity,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 15000),
      initialData: storedScore ? calculateVideoScore(storedScore) : undefined
    }
  );

  React.useEffect(() => {
    // Prefetch the next queries
    if (cohereKey) {
      queryClient.prefetchQuery(['seo-score', video.id]);
    }
  }, [cohereKey, video.id]);

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
            <SEOScoreIndicator score={null} size="sm" />
          </div>
        ) : seoScore ? (
          <div className="absolute top-2 right-2">
            <SEOScoreIndicator score={seoScore} size="sm" />
          </div>
        ) : null}
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