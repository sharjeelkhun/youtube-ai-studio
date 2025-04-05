import React, { useState, useEffect, useRef } from 'react';
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

  // Reset form data when video changes
  useEffect(() => {
    setFormData({
      title: video.title,
      description: video.description,
      tags: video.tags
    });
  }, [video]);

  useEffect(() => {
    const analyzeSEOScore = async () => {
      try {
        const analysis = await analyzeSEO(formData.title, formData.description, formData.tags);
        setSeoAnalysis(analysis);
      } catch (error) {
        console.error('Error analyzing SEO:', error);
      }
    };
    analyzeSEOScore();
  }, [formData]);

  if (!isOpen) return null;

  const handleSubmit = async (data: { title: string; description: string; tags: string[] }) => {
    if (!accessToken || !refreshSession()) {
      toast.error('Please sign in to update video details');
      return;
    }

    setIsLoading(true);
    try {
      await updateVideoDetails(video.id, accessToken, data);
      // Update local form data
      setFormData(data);
      onUpdate();
      toast.success('Video details updated successfully');
      onClose();
    } catch (error: any) {
      console.error('Failed to update video:', error);
      toast.error(error.message || 'Failed to update video details');
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Edit Video Details</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
            >
              {isOptimizing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              {isOptimizing ? 'Optimizing...' : 'AI Optimize'}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="mb-6">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full aspect-video object-cover rounded-lg"
              />
            </div>

            <VideoDetailsForm
              video={{ ...video, ...formData }} // Pass merged data
              onSubmit={handleSubmit}
              onCancel={onClose}
              isLoading={isLoading}
              ref={videoForm}
            />
          </div>

          <div>
            {seoAnalysis && <SEOAnalysisPanel analysis={seoAnalysis} />}
          </div>
        </div>
      </div>
    </div>
  );
}