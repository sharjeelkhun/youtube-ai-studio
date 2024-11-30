import React from 'react';
import { useQuery } from 'react-query';
import { getChannelVideos } from '../services/youtube';
import { useAuthStore } from '../store/authStore';
import { Loader2, Search } from 'lucide-react';
import { VideoCard } from './VideoCard';
import { motion } from 'framer-motion';

export function VideosTab() {
  const { accessToken } = useAuthStore();
  const [searchTerm, setSearchTerm] = React.useState('');
  
  const { data: videos, isLoading } = useQuery(
    ['videos', accessToken],
    () => getChannelVideos(accessToken!),
    {
      enabled: !!accessToken,
      staleTime: 5 * 60 * 1000,
    }
  );

  const filteredVideos = videos?.filter(video => 
    video.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Videos</h2>
        <div className="relative w-64">
          <input
            type="text"
            placeholder="Search videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos?.map((video) => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <VideoCard {...video} />
          </motion.div>
        ))}
      </div>

      {filteredVideos?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No videos found</p>
        </div>
      )}
    </div>
  );
}