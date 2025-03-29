import { aiService } from './ai/service';
import toast from 'react-hot-toast';
import { SEOAnalysis } from '../types/seo';
import { useAPIKeyStore } from '../store/apiKeyStore';
import { tryParseJson } from '../utils/json';
import { throttle } from '../utils/throttle';

const seoCache = new Map<string, SEOAnalysis>();

/**
 * Analyze SEO for a given video title, description, and tags.
 */
export async function analyzeSEO(title: string, description: string, tags: string[]): Promise<SEOAnalysis> {
  const cacheKey = `${title}-${description}-${tags.join(',')}`;
  if (seoCache.has(cacheKey)) {
    console.log('Returning cached SEO analysis');
    return seoCache.get(cacheKey)!;
  }

  const { getKey } = useAPIKeyStore.getState();
  const cohereKey = getKey('cohere');

  if (!cohereKey) {
    throw new Error('Cohere API key is missing. Please configure it in settings.');
  }

  try {
    const response = await fetch('https://api.cohere.ai/v1/analyze-seo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cohereKey}`,
      },
      body: JSON.stringify({ title, description, tags }),
    });

    const responseBody = await response.text();
    console.log('API Response Body:', responseBody);

    if (!response.ok) {
      handleAPIError(response);
    }

    const data = tryParseJson(responseBody, {});
    seoCache.set(cacheKey, data);
    return data;
  } catch (error: any) {
    console.error('Error in analyzeSEO:', error.message || error);
    throw new Error(error.message || 'Failed to analyze SEO. Please try again later.');
  }
}

/**
 * Optimize metadata for a given video.
 */
export async function getOptimizedMetadata(videoData: {
  title: string;
  description: string;
  tags: string[];
  views: string;
  likes: string;
}): Promise<{ title: string; description: string; tags: string[] }> {
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
    const optimizedData: { title: string; description: string; tags: string[] } = tryParseJson(response, {
      title: '',
      description: '',
      tags: [],
    });

    if (!optimizedData.title || !optimizedData.description || !Array.isArray(optimizedData.tags)) {
      throw new Error('Invalid optimized metadata received from AI.');
    }

    return {
      title: optimizedData.title.trim(),
      description: optimizedData.description.trim(),
      tags: [...new Set(optimizedData.tags.map((tag) => tag.trim()))],
    };
  } catch (error: any) {
    console.error('Error optimizing metadata:', error);
    throw new Error(error.message || 'Failed to optimize metadata');
  }
}

/**
 * Get video suggestions for improvement.
 */
export async function getVideoSuggestions(videoData: {
  title: string;
  description: string;
  views: string;
  likes: string;
}): Promise<string> {
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

/**
 * Handle API errors based on response status.
 */
function handleAPIError(response: Response): void {
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

// Wrap analyzeSEO with throttle to limit requests
export const throttledAnalyzeSEO = throttle(analyzeSEO, 1000); // Limit to 1 request per second