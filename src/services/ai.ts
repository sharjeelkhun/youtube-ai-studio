import { aiService } from './ai/service';
import toast from 'react-hot-toast';
import { SEOAnalysis } from '../types/seo';
import { useAPIKeyStore } from '../store/apiKeyStore';
import { tryParseJson } from '../utils/json';

const seoCache = new Map<string, SEOAnalysis>();

export async function analyzeSEO(title: string, description: string, tags: string[]) {
  try {
    const response = await fetch('https://api.cohere.ai/analyze-seo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${yourCohereApiKey}`, // Replace with your API key
      },
      body: JSON.stringify({ title, description, tags }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('API Response:', data); // Debugging the API response
    return data;
  } catch (error) {
    console.error('Error in analyzeSEO:', error);
    throw error; // Rethrow the error to be handled by the caller
  }
}

export async function getOptimizedMetadata(videoData: { 
  title: string; 
  description: string; 
  tags: string[];
  views: string;
  likes: string;
}) {
  const { getKey } = useAPIKeyStore.getState();
  const cohereKey = getKey('cohere');

  if (!cohereKey) {
    throw new Error('Please configure your Cohere API key in Settings');
  }

  const prompt = `Optimize this YouTube video's metadata for maximum visibility and engagement. Analyze the current performance and suggest specific improvements.

Current Video Metadata:
Title: "${videoData.title}"
Description: "${videoData.description}"
Current Tags: ${videoData.tags.join(', ')}
Performance: ${videoData.views} views, ${videoData.likes} likes

Requirements:
1. Title should be engaging, include keywords, and be 40-60 characters
2. Description should be detailed, include timestamps, and be minimum 1000 characters
3. Tags should be relevant and comprehensive (minimum 10 tags)

Return ONLY a JSON object with this structure:
{
  "title": "optimized title",
  "description": "optimized description",
  "tags": ["tag1", "tag2", "tag3", ...]
}`;

  try {
    const response = await aiService.generateContent(prompt);
    const optimizedData = tryParseJson(response, {
      title: '',
      description: '',
      tags: []
    });
    
    // Validate and sanitize the optimized data
    const sanitizedData = {
      title: typeof optimizedData.title === 'string' && optimizedData.title.trim()
        ? optimizedData.title.trim()
        : videoData.title,
      description: typeof optimizedData.description === 'string' && optimizedData.description.trim()
        ? optimizedData.description.trim()
        : videoData.description,
      tags: Array.isArray(optimizedData.tags)
        ? [...new Set(optimizedData.tags
            .filter(tag => typeof tag === 'string' && tag.trim())
            .map(tag => tag.trim()))]
        : videoData.tags
    };

    // Ensure we have meaningful changes
    if (sanitizedData.title === videoData.title &&
        sanitizedData.description === videoData.description &&
        JSON.stringify(sanitizedData.tags.sort()) === JSON.stringify(videoData.tags.sort())) {
      throw new Error('No meaningful optimization changes generated');
    }

    return sanitizedData;
  } catch (error: any) {
    console.error('Error optimizing metadata:', error);
    throw new Error(error.message || 'Failed to optimize metadata');
  }
}

export async function getVideoSuggestions(videoData: {
  title: string;
  description: string;
  views: string;
  likes: string;
}) {
  const { getKey } = useAPIKeyStore.getState();
  const cohereKey = getKey('cohere');

  if (!cohereKey) {
    throw new Error('Please configure your Cohere API key in Settings');
  }

  const prompt = `Analyze this YouTube video and provide detailed recommendations for improvement.

Video Details:
Title: "${videoData.title}"
Description: "${videoData.description}"
Performance: ${videoData.views} views, ${videoData.likes} likes

Provide specific, actionable recommendations for:
1. Title Optimization
2. Description Enhancement
3. Viewer Engagement
4. Thumbnail Design
5. Content Strategy

Format each suggestion as a clear, actionable item.`;

  try {
    const response = await aiService.generateContent(prompt);
    const suggestions = response.trim();
    
    if (suggestions.length < 200) {
      throw new Error('Insufficient suggestions generated');
    }
    
    return suggestions;
  } catch (error: any) {
    console.error('Error getting video suggestions:', error);
    throw new Error(error.message || 'Failed to get video suggestions');
  }
}