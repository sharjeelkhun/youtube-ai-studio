import React, { useState } from 'react';
import { Loader2, Layout, Sparkles, Tags } from 'lucide-react';
import { analyzeSEO } from '../services/ai';
import { aiService } from '../services/ai/service';
import { SEOAnalysisPanel } from './video/SEOAnalysisPanel';
import toast from 'react-hot-toast';
import { queryClient } from '../lib/queryClient';

export function SEOAnalyzer() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!title || !description) {
      toast.error('Title and description are required for SEO analysis.');
      return;
    }

    if (!aiService.hasActiveProvider()) {
      toast.error('Please configure an AI provider in Settings');
      return;
    }

    setIsLoading(true);
    try {
      const result = await analyzeSEO(
        title,
        description,
        tags.split(',').map((tag) => tag.trim()).filter(Boolean)
      );
      setAnalysis(result);
      
      // Cache the result
      queryClient.setQueryData(['seo-analysis', title + description], result);
      
      toast.success('Analysis completed successfully!');
    } catch (error: any) {
      if (error.message.includes('Rate limit')) {
        toast.error('Rate limit reached. The system will automatically retry with different providers.');
      } else if (error.message.includes('All providers')) {
        toast.error('All AI providers are currently unavailable. Please try again later.');
      } else {
        toast.error(error.message || 'Failed to analyze SEO');
      }
      console.error('Error analyzing SEO:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">SEO Analyzer</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Video Title
            </label>
            <div className="relative">
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Enter video title"
              />
              <Layout className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Video Description
            </label>
            <div className="relative">
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Enter video description"
                rows={4}
              />
              <Sparkles className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <div className="relative">
              <input
                id="tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Enter tags separated by commas"
              />
              <Tags className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              'Analyze SEO'
            )}
          </button>
        </div>
      </div>

      {analysis && (
        <div className="bg-white rounded-lg shadow-sm">
          <SEOAnalysisPanel analysis={analysis} />
        </div>
      )}
    </div>
  );
}