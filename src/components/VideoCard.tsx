import React, { useState } from 'react';
import { Eye, ThumbsUp, Calendar, Edit, Trash2, Lightbulb } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { VideoEditModal } from './VideoEditModal';
import { VideoSuggestionsModal } from './VideoSuggestionsModal';
import { deleteVideo } from '../services/videoEditor';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

interface VideoCardProps {
  id: string;
  title: string;
  thumbnail: string;
  views: string;
  likes: string;
  uploadDate: string;
  description: string;
  tags: string[];
  onUpdate: () => void;
}

export function VideoCard({ id, title, thumbnail, views, likes, uploadDate, description, tags, onUpdate }: VideoCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSuggestionsModalOpen, setIsSuggestionsModalOpen] = useState(false);
  const { accessToken } = useAuthStore();

  const handleDelete = async () => {
    if (!accessToken) return;

    if (window.confirm('Are you sure you want to delete this video?')) {
      try {
        await deleteVideo(id, accessToken);
        onUpdate();
      } catch (error) {
        console.error('Failed to delete video:', error);
      }
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="relative group">
          <img 
            src={thumbnail} 
            alt={title} 
            className="w-full aspect-video object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button
                onClick={() => setIsSuggestionsModalOpen(true)}
                className="p-2 bg-white rounded-full hover:bg-gray-100"
                title="Get AI Suggestions"
              >
                <Lightbulb className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="p-2 bg-white rounded-full hover:bg-gray-100"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 bg-white rounded-full hover:bg-gray-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2 min-h-[48px]">
            {title}
          </h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
              <Eye className="w-4 h-4 text-gray-600 mb-1" />
              <span className="text-sm font-medium">
                {parseInt(views).toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
              <ThumbsUp className="w-4 h-4 text-gray-600 mb-1" />
              <span className="text-sm font-medium">
                {parseInt(likes).toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
              <Calendar className="w-4 h-4 text-gray-600 mb-1" />
              <span className="text-sm font-medium">
                {format(parseISO(uploadDate), 'MMM d')}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <VideoEditModal
        video={{ id, title, thumbnail, views, likes, uploadDate, description, tags }}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={onUpdate}
      />

      <VideoSuggestionsModal
        video={{ id, title, thumbnail, views, likes, uploadDate, description, tags }}
        isOpen={isSuggestionsModalOpen}
        onClose={() => setIsSuggestionsModalOpen(false)}
      />
    </>
  );
}