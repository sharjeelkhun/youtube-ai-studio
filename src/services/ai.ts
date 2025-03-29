import { aiService } from './ai/service';
import toast from 'react-hot-toast';
import { SEOAnalysis } from '../types/seo';
import { useAPIKeyStore } from '../store/apiKeyStore';
import { tryParseJson } from '../utils/json';
import { throttle } from '../utils/throttle';

const seoCache = new Map<string, SEOAnalysis>();

export async function analyzeSEO(title: string, description: string, tags: string[]) {
  const cacheKey = `${title}-${description}-${tags.join(',')}`;
  if (seoCache.has(cacheKey)) {
    console.log('Returning cached SEO analysis');
    return seoCache.get(cacheKey);
  }

  const { getKey } = useAPIKeyStore.getState();
  const cohereKey = getKey('cohere');
  console.log('Retrieved Cohere API Key:', cohereKey); // Debug log

  if (!cohereKey) {
    throw new Error('Cohere API key is missing. Please configure it in settings.');
  }

  try {
    console.log('Using endpoint for analyzeSEO:', 'https://api.cohere.ai/v1/analyze-seo');
    const response = await fetch('https://api.cohere.ai/v1/analyze-seo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cohereKey}`, // Ensure the API key is sent
      },
      body: JSON.stringify({ title, description, tags }),
    });

    console.log('API Response Status:', response.status); // Debug log
    console.log('API Response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
    });

    const responseBody = await response.text(); // Read the response as text
    console.log('API Response Body:', responseBody); // Debug log

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized: Invalid API key.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (response.status === 404) {
        throw new Error('API endpoint not found. Please check the API URL.');
      } else {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
    }

    try {
      const data = JSON.parse(responseBody);
      seoCache.set(cacheKey, data); // Cache the response
      return data;
    } catch (error) {
      console.error('Error parsing API response as JSON:', error);
      return {
        error: 'Failed to parse API response',
        title: '',
        description: '',
        tags: [],
      };
    }
  } catch (error: any) {
    console.error('Error in analyzeSEO:', error.message || error);
    throw new Error(error.message || 'Failed to analyze SEO. Please try again later.');
  }
}

// Wrap analyzeSEO with throttle to limit requests
export const throttledAnalyzeSEO = throttle(analyzeSEO, 1000); // Limit to 1 request per second

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
        ? [...new Set(
            (optimizedData.tags as string[]) // Explicitly type as string[]
              .filter((tag) => typeof tag === 'string' && tag.trim()) // Ensure valid strings
              .map((tag) => tag.trim()) // Trim whitespace
          )]
        : Array.isArray(videoData.tags) // Fallback to videoData.tags if optimizedData.tags is invalid
        ? videoData.tags
        : [], // Fallback to an empty array
    };

    console.log('Optimized Tags:', sanitizedData.tags); // Debug log
    console.log('Fallback Tags:', videoData.tags); // Debug log

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