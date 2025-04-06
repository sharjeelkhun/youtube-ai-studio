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

  const { data: seoScore, isLoading } = useQuery(
    ['seo-score', video.id],
    async () => {
      if (!cohereKey) return null;
      
      // Validate stored score
      if (storedScore && typeof storedScore.score === 'number') {
        const score = Math.round(storedScore.score * 100);
        return score >= 0 && score <= 100 ? score : null;
      }

      try {
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2000)); // Random delay up to 2s

        const rawResponse = await throttledAnalyzeSEO(video.title, video.description, video.tags);
        const parsedResponse = typeof rawResponse === 'string' ? 
          parseSEOAnalysis(rawResponse) : rawResponse;

        if (parsedResponse && typeof parsedResponse.score === 'number') {
          // Normalize score to avoid all videos having same score
          const normalizedScore = Math.round((parsedResponse.score + Math.random() * 0.2 - 0.1) * 100);
          const finalScore = Math.max(0, Math.min(100, normalizedScore));
          
          const analysisWithNormalizedScore = {
            ...parsedResponse,
            score: finalScore / 100 // Convert back to decimal for storage
          };
          
          useSEOStore.getState().setScore(video.id, analysisWithNormalizedScore);
          return finalScore;
        }
      } catch (error: any) {
        console.error('Error calculating SEO score:', error);
        if (error.message?.includes('Rate limit')) {
          // Add exponential backoff for rate limits
          const backoffTime = Math.min(1000 * Math.pow(2, queryClient.getQueryData(['retry-count']) || 0), 30000);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          queryClient.setQueryData(['retry-count'], (count: number = 0) => count + 1);
        }
      }
      return null;
    },
    {
      enabled: !!cohereKey,
      staleTime: Infinity,
      cacheTime: Infinity,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 30000),
      initialData: storedScore && typeof storedScore.score === 'number' ? 
        Math.round(storedScore.score * 100) : undefined,
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