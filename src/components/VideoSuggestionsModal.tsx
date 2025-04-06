import React, { useState, useEffect } from 'react';
import { X, Loader2, Layout, Sparkles, Tags, Users, Image } from 'lucide-react';
import { getVideoSuggestions } from '../services/ai';
import { VideoData } from '../types/youtube';
import { aiService } from '../services/ai/service';
import { motion } from 'framer-motion';

interface VideoSuggestionsModalProps {
  video: VideoData;
  isOpen: boolean;
  onClose: () => void;
}

export function VideoSuggestionsModal({ video, isOpen, onClose }: VideoSuggestionsModalProps) {
  const [suggestions, setSuggestions] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && aiService.hasActiveProvider() && video.title && video.description) {
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

  const renderSuggestions = (suggestions: string) => {
    const sections = {
      title: [] as string[],
      description: [] as string[],
      engagement: [] as string[],
      thumbnail: [] as string[],
      content: [] as string[]
    };

    suggestions.split('\n').forEach(line => {
      const cleanLine = line.trim();
      if (!cleanLine) return;
      
      if (cleanLine.toLowerCase().includes('title')) {
        sections.title.push(cleanLine);
      } else if (cleanLine.toLowerCase().includes('description')) {
        sections.description.push(cleanLine);
      } else if (cleanLine.toLowerCase().includes('thumbnail')) {
        sections.thumbnail.push(cleanLine);
      } else if (cleanLine.toLowerCase().includes('engage') || cleanLine.toLowerCase().includes('viewer')) {
        sections.engagement.push(cleanLine);
      } else {
        sections.content.push(cleanLine);
      }
    });

    return (
      <div className="grid gap-6">
        {[
          { title: 'Title Optimization', icon: Layout, items: sections.title, color: 'blue' },
          { title: 'Description Enhancement', icon: Sparkles, items: sections.description, color: 'purple' },
          { title: 'Viewer Engagement', icon: Users, items: sections.engagement, color: 'green' },
          { title: 'Thumbnail Design', icon: Image, items: sections.thumbnail, color: 'orange' },
          { title: 'Content Strategy', icon: Tags, items: sections.content, color: 'pink' }
        ].map((section, index) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-lg border bg-${section.color}-50 border-${section.color}-200`}
          >
            <div className="flex items-center gap-2 mb-3">
              <section.icon className={`w-5 h-5 text-${section.color}-500`} />
              <h3 className="font-semibold text-gray-800">{section.title}</h3>
            </div>
            {section.items.length > 0 ? (
              <ul className="space-y-2">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">No suggestions available</p>
            )}
          </motion.div>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            AI-Powered Optimization Suggestions
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
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
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          renderSuggestions(suggestions)
        )}
      </div>
    </div>
  );
}