import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Wand2, Loader2 } from 'lucide-react';
import { updateVideoDetails } from '../services/videoEditor';
import { useAuthStore } from '../store/authStore';
import { VideoData } from '../types/youtube';
import { VideoDetailsForm } from './forms/VideoDetailsForm';
import { getOptimizedMetadata, analyzeSEO } from '../services/ai';
import { aiService } from '../services/ai/service';
import { SEOAnalysisPanel } from './video/SEOAnalysisPanel';
import toast from 'react-hot-toast';
import { refreshSession } from '../services/auth';
import { format } from 'date-fns';
import { useSEOStore } from '../store/seoStore';
import { motion } from 'framer-motion';

interface VideoEditModalProps {
  video: VideoData;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function VideoEditModal({ video, isOpen, onClose, onUpdate }: VideoEditModalProps) {
  const { accessToken } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [seoAnalysis, setSeoAnalysis] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: video.title,
    description: video.description,
    tags: video.tags
  });

  const videoForm = useRef<HTMLFormElement>(null);

  // Initialize SEO analysis when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: video.title,
        description: video.description,
        tags: video.tags
      });
      
      // Immediately start SEO analysis
      const initAnalysis = async () => {
        try {
          const analysis = await analyzeSEO(video.title, video.description, video.tags);
          if (analysis) {
            setSeoAnalysis(analysis);
            useSEOStore.getState().setScore(video.id, analysis);
          }
        } catch (error) {
          console.error('Error analyzing SEO:', error);
          // Don't show error toast here since we're auto-loading
        }
      };
      
      initAnalysis();
    }
  }, [isOpen, video]);

  if (!isOpen) return null;

  const handleSubmit = async (data: { title: string; description: string; tags: string[] }) => {
    if (!accessToken || !refreshSession()) {
      toast.error('Please sign in to update video details');
      return;
    }

    setIsLoading(true);
    try {
      await updateVideoDetails(video.id, accessToken, data);
      setFormData(data);
      onUpdate();
      toast.success('Video details updated successfully');
      // Removed onClose() here to prevent auto-closing
    } catch (error: any) {
      console.error('Failed to update video:', error);
      toast.error(error.message || 'Failed to update video details');
      // Don't close modal on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptimize = async () => {
    if (!aiService.hasActiveProvider()) {
      toast.error('Please configure an AI provider in Settings');
      return;
    }

    if (!formData.title || !formData.description) {
      toast.error('Title and description are required for optimization');
      return;
    }

    setIsOptimizing(true);
    try {
      const optimizedData = await getOptimizedMetadata({
        title: formData.title,
        description: formData.description,
        tags: formData.tags,
        views: video.views,
        likes: video.likes,
      });

      // Update form data with optimized content
      const newFormData = {
        title: optimizedData.title || formData.title,
        description: optimizedData.description || formData.description,
        tags: optimizedData.tags?.length ? optimizedData.tags : formData.tags,
      };

      setFormData(newFormData);

      // Only update form fields if videoForm ref is available
      if (videoForm.current) {
        const titleInput = videoForm.current.querySelector<HTMLInputElement>('input[name="title"]');
        const descriptionInput = videoForm.current.querySelector<HTMLTextAreaElement>('textarea[name="description"]');
        
        if (titleInput) titleInput.value = newFormData.title;
        if (descriptionInput) descriptionInput.value = newFormData.description;
      }

      const newAnalysis = await analyzeSEO(
        newFormData.title,
        newFormData.description,
        newFormData.tags
      );
      setSeoAnalysis(newAnalysis);

      toast.success('Content optimized successfully! Review and save the changes.');
    } catch (error: any) {
      console.error('Failed to optimize video:', error);
      toast.error(error.message || 'Failed to optimize video details');
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex z-50"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", duration: 0.3 }}
        className="relative bg-white w-full max-w-5xl rounded-2xl shadow-2xl mx-auto min-h-screen"
      >
        <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200/80">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                Edit Video
              </h2>
              <button
                onClick={handleOptimize}
                disabled={isOptimizing}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-200 shadow-sm hover:shadow disabled:opacity-50"
              >
                {isOptimizing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
                {isOptimizing ? 'Optimizing...' : 'AI Optimize'}
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 h-[calc(90vh-80px)]">
          <div className="p-6 overflow-y-auto border-r border-gray-200/80">
            <div className="bg-gradient-to-b from-gray-50 to-white rounded-xl p-4 mb-6 shadow-sm">
              <div className="aspect-video rounded-lg overflow-hidden shadow-md mb-4">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 font-medium">
                  {format(new Date(video.uploadDate), 'MMMM d, yyyy')}
                </span>
                <div className="flex items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-1">
                    <span>{parseInt(video.views).toLocaleString()}</span>
                    <span className="text-gray-400">views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>{parseInt(video.likes).toLocaleString()}</span>
                    <span className="text-gray-400">likes</span>
                  </div>
                </div>
              </div>
            </div>

            <VideoDetailsForm
              video={{ ...video, ...formData }}
              onSubmit={handleSubmit}
              onCancel={onClose}
              isLoading={isLoading}
              ref={videoForm}
            />
          </div>

          <motion.div 
            className="bg-gradient-to-br from-gray-50 to-white p-6 overflow-y-auto"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {seoAnalysis ? (
              <SEOAnalysisPanel analysis={seoAnalysis} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                <p className="text-gray-500 text-sm">Analyzing video content...</p>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}