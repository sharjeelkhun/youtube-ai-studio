import React, { useState } from 'react';
import { analyzeSEO } from '../services/ai';
import { Loader2, Search, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { checkRequiredEnv } from '../config/env';
import { motion } from 'framer-motion';

export function SEOAnalyzer() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!checkRequiredEnv('gemini')) {
      toast.error('Please configure your Gemini API key');
      return;
    }

    if (!title || !description) {
      toast.error('Please provide both title and description');
      return;
    }

    setLoading(true);
    try {
      const result = await analyzeSEO(
        title,
        description,
        tags.split(',').map(tag => tag.trim()).filter(Boolean)
      );
      setAnalysis(result || '');
      toast.success('Analysis completed successfully');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to analyze SEO. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto p-6"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">SEO Analyzer</h1>
        <p className="text-gray-600 mt-2">Optimize your video metadata for better visibility</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Video Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Enter your video title"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Video Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 h-32"
              placeholder="Enter your video description"
            />
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
              Tags (comma-separated)
            </label>
            <input
              id="tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="gaming, tutorial, tips, etc."
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Search className="w-5 h-5" />
                Analyze SEO
              </>
            )}
          </button>
        </div>
      </div>

      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
          <div className="prose max-w-none">
            {analysis.split('\n').map((line, index) => (
              <p key={index} className="mb-4">{line}</p>
            ))}
          </div>
        </motion.div>
      )}

      {!checkRequiredEnv('gemini') && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-700">
            Please configure your Gemini API key in the environment variables to use the SEO Analyzer.
          </p>
        </div>
      )}
    </motion.div>
  );
}