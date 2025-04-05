import React, { useState, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { VideoData } from '../../types/youtube';
import { TagList } from '../video/TagList';

interface VideoDetailsFormProps {
  video: VideoData;
  onSubmit: (data: { title: string; description: string; tags: string[] }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const VideoDetailsForm = forwardRef<HTMLFormElement, VideoDetailsFormProps>(
  ({ video, onSubmit, onCancel, isLoading = false }, ref) => {
    const [title, setTitle] = useState(video.title);
    const [description, setDescription] = useState(video.description);
    const [tags, setTags] = useState(video.tags);
    const [newTag, setNewTag] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      await onSubmit({
        title,
        description,
        tags
      });
    };

    const handleAddTag = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && newTag.trim()) {
        e.preventDefault();
        setTags([...tags, newTag.trim()]);
        setNewTag('');
      }
    };

    const handleRemoveTag = (index: number) => {
      setTags(tags.filter((_, i) => i !== index));
    };

    return (
      <form ref={ref} onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="Press Enter to add tag"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 mb-2"
            disabled={isLoading}
          />
          <TagList 
            tags={tags} 
            onRemove={handleRemoveTag}
            editable={!isLoading}
            className="mt-2"
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
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