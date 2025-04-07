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
  const storedScore = useSEOStore((state) => state.getScore(video.id));
  const retryCountRef = React.useRef(0);
  const batchIndex = React.useRef(Math.floor(Math.random() * BATCH_SIZE));

  const calculateVideoScore = (data: any): number => {
    if (!data) return 0; // Return 0 if no data

    let titleScore = 0;
    let descriptionScore = 0;
    let tagsScore = 0;

    // Title scoring (35%)
    if (video.title) {
      if (video.title.length >= 40 && video.title.length <= 70) titleScore += 35;
      else if (video.title.length >= 20) titleScore += 20;
      if (/^[A-Z]/.test(video.title)) titleScore += 15;
      if (video.title.includes('|') || video.title.includes('-')) titleScore += 15;
      if (/(how|why|what|when|top|best|\d+)/i.test(video.title)) titleScore += 15;
      titleScore = Math.min(titleScore, 100);
    }

    // Description scoring (35%)
    if (video.description) {
      if (video.description.length >= 250) descriptionScore += 40;
      else if (video.description.length >= 100) descriptionScore += 20;
      if (video.description.includes('\n\n')) descriptionScore += 20;
      if (/https?:\/\/[^\s]+/.test(video.description)) descriptionScore += 20;
      if (video.description.toLowerCase().includes('subscribe') || 
          video.description.toLowerCase().includes('follow')) descriptionScore += 20;
      descriptionScore = Math.min(descriptionScore, 100);
    }

    // Tags scoring (30%)
    if (video.tags && Array.isArray(video.tags)) {
      if (video.tags.length >= 15) tagsScore += 40;
      else if (video.tags.length >= 8) tagsScore += 25;
      else if (video.tags.length >= 3) tagsScore += 15;
      
      // Check tag quality
      const hasLongTags = video.tags.some(tag => tag.length > 15);
      const hasShortTags = video.tags.some(tag => tag.length < 15);
      if (hasLongTags && hasShortTags) tagsScore += 30;
      
      // Check for keyword variations
      const keywordVariations = video.tags.filter(tag => 
        video.title.toLowerCase().includes(tag.toLowerCase())
      ).length;
      if (keywordVariations >= 3) tagsScore += 30;
      
      tagsScore = Math.min(tagsScore, 100);
    }

    // Calculate weighted score
    const finalScore = Math.round(
      (titleScore * BASE_SCORES.TITLE_WEIGHT) +
      (descriptionScore * BASE_SCORES.DESC_WEIGHT) +
      (tagsScore * BASE_SCORES.TAGS_WEIGHT)
    );

    // Normalize between MIN and MAX scores
    return Math.min(
      Math.max(
        Math.round(BASE_SCORES.MIN_SCORE + (finalScore * (BASE_SCORES.MAX_SCORE - BASE_SCORES.MIN_SCORE) / 100)),
        BASE_SCORES.MIN_SCORE
      ),
      BASE_SCORES.MAX_SCORE
    );
  };

  const { data: seoScore, isLoading, error } = useQuery(
    ['seo-score', video.id],
    async () => {
      if (!cohereKey) return null;
      
      try {
        const batchDelay = (batchIndex.current * DELAY_BETWEEN_BATCHES) / BATCH_SIZE;
        await new Promise(resolve => setTimeout(resolve, batchDelay));
        
        const rawResponse = await throttledAnalyzeSEO(video.title, video.description, video.tags);
        if (!rawResponse) return null;

        const parsedResponse = typeof rawResponse === 'string' ? 
          parseSEOAnalysis(rawResponse) : rawResponse;

        if (!validateResponse(parsedResponse)) {
          console.error('Invalid response structure:', parsedResponse);
          return null;
        }

        const score = calculateVideoScore({
          ...parsedResponse,
          title: video.title,
          description: video.description,
          tags: video.tags
        });

        if (score > 0) {
          useSEOStore.getState().setScore(video.id, {
            ...parsedResponse,
            score: score / 100
          });
          return score;
        }
        return null;

      } catch (error: any) {
        console.error('Error calculating SEO score:', error);
        const isRateLimit = error.message?.includes('Rate limit');
        
        if (isRateLimit && retryCountRef.current < MAX_RETRIES) {
          const delay = Math.min(MIN_RETRY_DELAY * Math.pow(2, retryCountRef.current), MAX_RETRY_DELAY);
          await new Promise(resolve => setTimeout(resolve, delay));
          retryCountRef.current++;
          throw error; // Trigger retry
        }
        
        return null;
      }
    },
    {
      enabled: !!cohereKey && !!video.title && video.title.length > 0,
      staleTime: 12 * 60 * 60 * 1000,
      cacheTime: 24 * 60 * 60 * 1000,
      retry: MAX_RETRIES,
      retryDelay: (attemptIndex) => Math.min(MIN_RETRY_DELAY * Math.pow(2, attemptIndex), MAX_RETRY_DELAY),
      onError: (err) => {
        console.error('Query error:', err);
        retryCountRef.current = 0;
      }
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