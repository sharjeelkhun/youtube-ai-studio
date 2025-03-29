import React from 'react';
import { X } from 'lucide-react';
import { VideoData } from '../types/youtube';

interface VideoSuggestionsModalProps {
  video: VideoData;
  aiSuggestions: string[] | null;
  isOpen: boolean;
  onClose: () => void;
}

export function VideoSuggestionsModal({
  video,
  aiSuggestions,
  isOpen,
  onClose,
}: VideoSuggestionsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">AI Suggestions for {video.title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <ul className="mt-4 space-y-2">
          {aiSuggestions?.map((suggestion, index) => (
            <li key={index} className="text-gray-700">
              {suggestion}
            </li>
          )) || <p>No suggestions available.</p>}
        </ul>
        <button onClick={onClose} className="mt-4 btn btn-primary">
          Close
        </button>
      </div>
    </div>
  );
}