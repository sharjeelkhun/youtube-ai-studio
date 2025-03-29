import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useAuthStore } from '../store/authStore';
import { getChannelVideos, getAISuggestions } from '../services/youtube';
import { VideoCard } from './VideoCard';
import { VideoEditModal } from './VideoEditModal';
import { VideoSuggestionsModal } from './VideoSuggestionsModal';
import { VideoData } from '../types/youtube';
import { Loader2, Search } from 'lucide-react';

export function VideosTab() {
  const { accessToken, isAuthenticated } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const [aiSuggestions, setAISuggestions] = useState<string[] | null>(null);

  const { data: videos, isLoading, refetch } = useQuery(
    ['videos', accessToken],
    () => getChannelVideos(accessToken!),
    {
      enabled: !!accessToken,
      staleTime: 5 * 60 * 1000,
    }
  );

  const handleFetchAISuggestions = async (videoId: string) => {
    if (!accessToken) return;

    try {
      const suggestions = await getAISuggestions(videoId, accessToken);
      setAISuggestions(suggestions);
      setShowSuggestionsModal(true);
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
    }
  };

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
              handleFetchAISuggestions(video.id);
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
          aiSuggestions={aiSuggestions}
          isOpen={showSuggestionsModal}
          onClose={() => {
            setShowSuggestionsModal(false);
            setAISuggestions(null);
          }}
        />
      )}
    </div>
  );
}