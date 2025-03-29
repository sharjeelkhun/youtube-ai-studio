import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { analyzeSEO } from '../services/ai';
import toast from 'react-hot-toast';

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

    setIsLoading(true);
    try {
      const result = await analyzeSEO(
        title,
        description,
        tags.split(',').map((tag) => tag.trim()).filter(Boolean)
      );
      setAnalysis(result);
      toast.success('Analysis completed successfully!');
    } catch (error: any) {
      if (error.message.includes('Rate limit exceeded')) {
        toast.error('You are sending too many requests. Please wait and try again.');
      } else if (error.message.includes('API endpoint not found')) {
        toast.error('The API endpoint is incorrect. Please check your configuration.');
      } else {
        toast.error('Failed to optimize metadata. Please try again later.');
      }
      console.error('Error optimizing metadata:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">SEO Analyzer</h2>

      <div className="mb-4">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Video Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Enter video title"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Video Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Enter video description"
          rows={4}
        />
      </div>

      <div className="mb-4">
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
          Tags (comma-separated)
        </label>
        <input
          id="tags"
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Enter tags separated by commas"
        />
      </div>

      <button
        onClick={handleAnalyze}
        disabled={isLoading}
        className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
        ) : (
          'Analyze SEO'
        )}
      </button>

      {analysis && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">SEO Analysis Results</h3>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
            {JSON.stringify(analysis, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}