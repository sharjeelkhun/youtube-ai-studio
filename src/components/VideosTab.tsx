import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useAuthStore } from '../store/authStore';
import { getChannelVideos } from '../services/youtube';
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
        return videos;
      } catch (error: any) {
        console.error('Error fetching videos:', error);
        throw error;
      }
    },
    {
      enabled: !!accessToken,
      staleTime: Infinity, // Never consider data stale automatically
      cacheTime: Infinity, // Keep data cached indefinitely
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchInterval: false, // Disable periodic refetching
      retry: 1,
    }
  );

  const filteredVideos = React.useMemo(() => {
    return videos?.filter(video =>
      video.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];
  }, [videos, searchQuery]);

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
          onUpdate={async () => {
            await refetch(); // Wait for refetch to complete
          }}
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