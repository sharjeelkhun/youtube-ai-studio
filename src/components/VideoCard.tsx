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

// Add batch size and delay constants
const BATCH_SIZE = 3;
const DELAY_BETWEEN_BATCHES = 5000;

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

  const { data: seoScore, isLoading } = useQuery(
    ['seo-score', video.id],
    async () => {
      if (!cohereKey) return null;
      
      // Return stored score if valid
      if (storedScore && typeof storedScore.score === 'number') {
        const score = Math.round(storedScore.score * 100);
        if (score >= 0 && score <= 100) {
          return score;
        }
      }

      try {
        // Stagger requests in batches
        const batchDelay = (batchIndex.current * DELAY_BETWEEN_BATCHES) / BATCH_SIZE;
        await new Promise(resolve => setTimeout(resolve, batchDelay));

        const rawResponse = await throttledAnalyzeSEO(video.title, video.description, video.tags);
        const parsedResponse = typeof rawResponse === 'string' ? 
          parseSEOAnalysis(rawResponse) : rawResponse;

        if (parsedResponse && typeof parsedResponse.score === 'number') {
          // Ensure score is within valid range
          const baseScore = Math.min(Math.max(parsedResponse.score, 0), 1);
          // Add small random variation
          const variation = (Math.random() * 0.1) - 0.05; // ±5%
          const finalScore = Math.round((baseScore + variation) * 100);
          
          const analysisWithNormalizedScore = {
            ...parsedResponse,
            score: finalScore / 100
          };
          
          useSEOStore.getState().setScore(video.id, analysisWithNormalizedScore);
          return finalScore;
        }
      } catch (error: any) {
        console.error('Error calculating SEO score:', error);
        if (error.message?.includes('Rate limit')) {
          // Handle rate limit with local ref counter
          const backoffTime = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
          retryCountRef.current += 1;
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          
          // Reset retry count after max retries
          if (retryCountRef.current >= 3) {
            retryCountRef.current = 0;
            throw new Error('Max retries exceeded');
          }
        }
      }
      return null;
    },
    {
      enabled: !!cohereKey,
      staleTime: 24 * 60 * 60 * 1000, // 24 hours
      cacheTime: Infinity,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 30000),
      initialData: storedScore && typeof storedScore.score === 'number' ? 
        Math.min(Math.max(Math.round(storedScore.score * 100), 0), 100) : undefined,
      onError: () => {
        // Reset retry count on error
        retryCountRef.current = 0;
      },
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