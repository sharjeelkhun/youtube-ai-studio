import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useAuthStore } from '../store/authStore';
import { getChannelVideos } from '../services/youtube';
import { analyzeSEO } from '../services/ai';
import { useSEOStore } from '../store/seoStore';
import { VideoCard } from './VideoCard';
import { VideoEditModal } from './VideoEditModal';
import { VideoSuggestionsModal } from './VideoSuggestionsModal';
import { VideoData } from '../types/youtube';
import { Loader2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { refreshSession } from '../services/auth';

export function VideosTab() {
  const { accessToken, isAuthenticated } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);

  // Add auth check effect
  useEffect(() => {
    if (!isAuthenticated) {
      const wasRestored = refreshSession();
      if (!wasRestored) {
        toast.error('Session expired. Please sign in again.');
      }
    }
  }, [isAuthenticated]);

  const { data: videos, isLoading, refetch, error } = useQuery(
    ['videos', accessToken],
    async () => {
      if (!refreshSession()) return null;
      if (!accessToken) return null;
      try {
        const videos = await getChannelVideos(accessToken);
        
        // Process videos in smaller batches to avoid rate limits
        if (videos) {
          const seoStore = useSEOStore.getState();
          const batchSize = 5;
          
          for (let i = 0; i < videos.length; i += batchSize) {
            const batch = videos.slice(i, Math.min(i + batchSize, videos.length));
            await Promise.all(
              batch.map(async (video) => {
                if (!seoStore.getScore(video.id)) {
                  try {
                    await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay between videos
                    const analysis = await analyzeSEO(video.title, video.description, video.tags);
                    seoStore.setScore(video.id, analysis);
                  } catch (error) {
                    console.error(`Error analyzing video ${video.id}:`, error);
                  }
                }
              })
            );
          }
        }
        
        return videos;
      } catch (error) {
        console.error('Error fetching videos:', error);
        throw error;
      }
    },
    {
      enabled: !!accessToken,
      staleTime: Infinity, // Prevent automatic refetching
      cacheTime: 24 * 60 * 60 * 1000, // Cache for 24 hours
      refetchOnWindowFocus: false, // Disable refetch on window focus
      refetchOnMount: false, // Disable refetch on mount
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 30000),
      onError: (error: any) => {
        const message = error?.message || 'Failed to load videos';
        if (message.includes('401') || message.toLowerCase().includes('unauthorized')) {
          refreshSession();
        } else {
          toast.error(`${message}. Retrying...`);
        }
        console.error('Videos fetch error:', error);
      }
    }
  );

  // Add auto-retry effect
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        refetch();
      }, 5000); // Retry after 5 seconds on error
      return () => clearTimeout(timer);
    }
  }, [error, refetch]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)]">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in Required</h2>
        <p className="text-gray-600">Please sign in to view your videos</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  // Show error state with retry button
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)]">
        <p className="text-red-500 mb-4">Failed to load videos</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const filteredVideos = videos?.filter(video =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Videos</h1>
          <p className="text-gray-600 mt-1">
            Showing {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="relative w-64">
          <input
            type="text"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            onEdit={() => {
              setSelectedVideo(video);
              setShowEditModal(true);
            }}
            onSuggestions={() => {
              setSelectedVideo(video);
              setShowSuggestionsModal(true);
            }}
          />
        ))}
      </div>

      {selectedVideo && showEditModal && (
        <VideoEditModal
          video={selectedVideo}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onUpdate={refetch}
        />
      )}

      {selectedVideo && showSuggestionsModal && (
        <VideoSuggestionsModal
          video={selectedVideo}
          isOpen={showSuggestionsModal}
          onClose={() => setShowSuggestionsModal(false)}
        />
      )}
    </div>
  );
}