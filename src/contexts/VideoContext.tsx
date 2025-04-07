import React, { createContext, useContext, useState } from 'react';
import { VideoData } from '../types/youtube';

interface VideoContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredVideos: VideoData[];
  setAllVideos: (videos: VideoData[]) => void;
}

const VideoContext = createContext<VideoContextType | null>(null);

export function VideoProvider({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [allVideos, setAllVideos] = useState<VideoData[]>([]);

  const filteredVideos = React.useMemo(() => {
    return allVideos.filter(video =>
      video.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allVideos, searchQuery]);

  return (
    <VideoContext.Provider value={{ searchQuery, setSearchQuery, filteredVideos, setAllVideos }}>
      {children}
    </VideoContext.Provider>
  );
}

export const useVideoContext = () => {
  const context = useContext(VideoContext);
  if (!context) throw new Error('useVideoContext must be used within VideoProvider');
  return context;
};
