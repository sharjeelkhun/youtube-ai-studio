import { aiService } from './ai/service';
export { aiService }; // Re-export aiService

import toast from 'react-hot-toast';
import { SEOAnalysis } from '../types/seo';
import { useAPIKeyStore } from '../store/apiKeyStore';
import { tryParseJson } from '../utils/json';
import { throttle } from '../utils/throttle';

const seoCache = new Map<string, SEOAnalysis>();

export async function analyzeSEO(title: string, description: string, tags: string[]): Promise<SEOAnalysis> {
  const cacheKey = `${title}-${description}-${tags.join(',')}`;
  if (seoCache.has(cacheKey)) {
    return seoCache.get(cacheKey)!;
  }

  try {
    const response = await aiService.generateContent(`Analyze this YouTube video content for SEO optimization...`);
    const data = tryParseJson(response, {}) as SEOAnalysis;
    
    if (!data || typeof data.score !== 'number') {
      throw new Error('Invalid SEO analysis data structure');
    }

    seoCache.set(cacheKey, data);
    return data;
  } catch (error: any) {
    if (error.message.includes('Rate limit')) {
      // Let AIService handle the rate limit and provider switching
      return analyzeSEO(title, description, tags);
    }
    throw error;
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

  const prompt = `Given a YouTube video, optimize its metadata for maximum visibility and engagement.
Format the response as a JSON object with the following structure:
{
  "title": "optimized title",
  "description": "optimized description",
  "tags": ["tag1", "tag2", "tag3"]
}

Current Video:
Title: "${videoData.title}"
Description: "${videoData.description}"
Current Tags: ${videoData.tags.join(', ')}
Performance: ${videoData.views} views, ${videoData.likes} likes

Requirements:
- Title: 40-60 characters, engaging, include keywords
- Description: Minimum 1000 characters, include timestamps
- Tags: Minimum 10 relevant tags

Response must be ONLY the JSON object, no other text.`;

  try {
    console.log('Sending optimization request to Cohere...');
    
    const response = await fetch('https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cohereKey}`,
      },
      body: JSON.stringify({
        model: 'command',
        prompt,
        max_tokens: 1000,
        temperature: 0.7,
        response_format: 'json',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Cohere API Error:', error);
      throw new Error(response.status === 429 
        ? 'Rate limit exceeded. Please wait a moment and try again.'
        : `API Error: ${response.status} ${response.statusText}`
      );
    }

    const rawResponse = await response.json();
    console.log('Raw AI Response:', rawResponse);

    if (!rawResponse.generations?.[0]?.text) {
      throw new Error('Invalid API response structure');
    }

    const generatedText = rawResponse.generations[0].text;
    console.log('Generated Text:', generatedText);

    const optimizedData = tryParseJson<{ title: string; description: string; tags: string[] }>(
      generatedText,
      {
        title: '',
        description: '',
        tags: [],
      }
    );

    // Validate and sanitize the response
    if (!optimizedData.title || !optimizedData.description || !Array.isArray(optimizedData.tags)) {
      console.error('Invalid optimization data:', optimizedData);
      throw new Error('Invalid optimization data received from AI');
    }

    return {
      title: optimizedData.title.trim().slice(0, 100), // Limit title length
      description: optimizedData.description.trim(),
      tags: [...new Set(optimizedData.tags
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
        .slice(0, 500))] // Limit number of tags
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