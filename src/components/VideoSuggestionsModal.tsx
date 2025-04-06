import React, { useState, useEffect } from 'react';
import { X, Loader2, Layout, Sparkles, Users, Image, Lightbulb } from 'lucide-react';
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
    const cleanSuggestion = (text: string) => {
      return text
        .replace(/["{}[\],]/g, '')  // Remove JSON symbols
        .replace(/score:|suggestions:/gi, '')  // Remove JSON keys
        .replace(/^[•-]\s*/, '')  // Remove bullet points
        .replace(/^titleAnalysis|descriptionAnalysis|tagsAnalysis/gi, '')  // Remove analysis headers
        .trim();
    };

    const sections = {
      title: [] as string[],
      description: [] as string[],
      engagement: [] as string[],
      thumbnail: [] as string[],
      content: [] as string[]
    };

    suggestions.split('\n').forEach(line => {
      const cleanLine = cleanSuggestion(line);
      if (!cleanLine || cleanLine.length < 5) return;
      
      if (line.toLowerCase().includes('title')) {
        sections.title.push(cleanLine);
      } else if (line.toLowerCase().includes('description')) {
        sections.description.push(cleanLine);
      } else if (line.toLowerCase().includes('thumbnail')) {
        sections.thumbnail.push(cleanLine);
      } else if (line.toLowerCase().includes('engage') || line.toLowerCase().includes('viewer')) {
        sections.engagement.push(cleanLine);
      } else if (!line.includes(':') && !line.includes('{') && !line.includes('}')) {
        sections.content.push(cleanLine);
      }
    });

    const suggestionSections = [
      { title: 'Title Optimization', icon: Layout, items: sections.title },
      { title: 'Description Enhancement', icon: Sparkles, items: sections.description },
      { title: 'Viewer Engagement', icon: Users, items: sections.engagement },
      { title: 'Thumbnail Design', icon: Image, items: sections.thumbnail },
      { title: 'Content Strategy', icon: Lightbulb, items: sections.content }
    ];

    return (
      <div className="space-y-6">
        {suggestionSections.map((section, index) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center gap-2 mb-3">
              <section.icon className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-800">{section.title}</h3>
            </div>
            {section.items.length > 0 ? (
              <ul className="space-y-3">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                    <span className="mt-1 text-gray-400">•</span>
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
      <div className="bg-white rounded-lg w-full max-w-3xl p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Optimization Suggestions
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
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