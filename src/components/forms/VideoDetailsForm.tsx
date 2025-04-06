import React, { useState, forwardRef, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { VideoData } from '../../types/youtube';
import { TagList } from '../video/TagList';
import toast from 'react-hot-toast';

interface VideoDetailsFormProps {
  video: VideoData;
  onSubmit: (data: { title: string; description: string; tags: string[] }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const VideoDetailsForm = forwardRef<HTMLFormElement, VideoDetailsFormProps>(
  ({ video, onSubmit, onCancel, isLoading = false }, ref) => {
    const [formState, setFormState] = useState({
      title: video.title,
      description: video.description,
      tags: video.tags,
      newTag: ''
    });

    const [validation, setValidation] = useState({
      title: true,
      description: true,
      tags: true
    });

    // Sync form state with video prop changes
    useEffect(() => {
      setFormState(prev => ({
        ...prev,
        title: video.title,
        description: video.description,
        tags: video.tags
      }));
    }, [video]);

    // Validation rules
    const validateForm = () => {
      const newValidation = {
        title: formState.title.length >= 5 && formState.title.length <= 100,
        description: formState.description.length >= 50,
        tags: formState.tags.length >= 3
      };
      setValidation(newValidation);
      return Object.values(newValidation).every(Boolean);
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateForm()) {
        toast.error('Please fix validation errors before submitting');
        return;
      }
      await onSubmit({
        title: formState.title,
        description: formState.description,
        tags: formState.tags
      });
    };

    const handleAddTag = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && formState.newTag.trim()) {
        e.preventDefault();
        setFormState(prev => ({
          ...prev,
          tags: [...prev.tags, prev.newTag.trim()],
          newTag: ''
        }));
      }
    };

    const handleRemoveTag = (index: number) => {
      setFormState(prev => ({
        ...prev,
        tags: prev.tags.filter((_, i) => i !== index)
      }));
    };

    const handleChange = (field: 'title' | 'description' | 'newTag') => (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      setFormState(prev => ({
        ...prev,
        [field]: e.target.value
      }));
    };

    return (
      <form ref={ref} onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title {!validation.title && 
              <span className="text-red-500 text-xs ml-1">
                (5-100 characters required)
              </span>
            }
          </label>
          <div className="relative">
            <input
              name="title"
              type="text"
              value={formState.title}
              onChange={handleChange('title')}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 ${
                validation.title ? 'focus:ring-blue-500 border-gray-300' : 'border-red-300 focus:ring-red-500'
              } transition-colors`}
              disabled={isLoading}
            />
            <span className="absolute right-3 top-2.5 text-xs font-medium text-gray-400">
              {formState.title.length}/100
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description {!validation.description && 
              <span className="text-red-500 text-xs ml-1">
                (Minimum 50 characters)
              </span>
            }
          </label>
          <div className="relative">
            <textarea
              name="description"
              value={formState.description}
              onChange={handleChange('description')}
              rows={6}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 ${
                validation.description ? 'focus:ring-blue-500 border-gray-300' : 'border-red-300 focus:ring-red-500'
              } transition-colors resize-none`}
              disabled={isLoading}
            />
            <span className="absolute right-3 bottom-3 text-xs font-medium text-gray-400">
              {formState.description.length} chars
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags {!validation.tags && 
              <span className="text-red-500 text-xs ml-1">
                (Minimum 3 tags required)
              </span>
            }
          </label>
          <input
            name="newTag"
            type="text"
            value={formState.newTag}
            onChange={handleChange('newTag')}
            onKeyDown={handleAddTag}
            placeholder="Type a tag and press Enter"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-2 transition-colors"
            disabled={isLoading}
          />
          <TagList 
            tags={formState.tags} 
            onRemove={handleRemoveTag}
            editable={!isLoading}
            className="mt-2"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    );
  }
);

VideoDetailsForm.displayName = 'VideoDetailsForm';