import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { getVideoSuggestions } from '../services/ai';
import { VideoData } from '../types/youtube';
import { aiService } from '../services/ai/service';

interface VideoSuggestionsModalProps {
  video: VideoData;
  isOpen: boolean;
  onClose: () => void;
}

export function VideoSuggestionsModal({ video, isOpen, onClose }: VideoSuggestionsModalProps) {
  const [suggestions, setSuggestions] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && aiService.hasActiveProvider()) {
      setLoading(true);
      getVideoSuggestions({
        title: video.title,
        description: video.description,
        views: video.views,
        likes: video.likes,
      })
        .then(setSuggestions)
        .catch((error) => {
          console.error('Error fetching video suggestions:', error);
          setSuggestions('Failed to fetch suggestions. Please try again later.');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, video]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">AI Suggestions</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!aiService.hasActiveProvider() ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-700">
              Please configure an AI provider in Settings to get AI-powered suggestions.
            </p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="prose max-w-none">
            {suggestions.split('\n').map((line, index) => (
              <p key={index} className="mb-4">{line}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}