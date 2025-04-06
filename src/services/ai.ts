import { aiService } from './ai/service';
export { aiService }; // Re-export aiService

import toast from 'react-hot-toast';
import { SEOAnalysis } from '../types/seo';
import { useAPIKeyStore } from '../store/apiKeyStore';
import { tryParseJson } from '../utils/json';
import { throttle } from '../utils/throttle';

const seoCache = new Map<string, SEOAnalysis>();

// Global rate limiting
const requestQueue: Array<() => Promise<any>> = [];
let isProcessing = false;
let lastRequestTime = Date.now();
const MIN_REQUEST_DELAY = 2000; // 2 seconds between requests

const processQueue = async () => {
  if (isProcessing) return;
  isProcessing = true;

  while (requestQueue.length > 0) {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < MIN_REQUEST_DELAY) {
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_DELAY - timeSinceLastRequest));
    }

    const request = requestQueue.shift();
    if (request) {
      lastRequestTime = Date.now();
      try {
        await request();
      } catch (error) {
        console.error('Queue processing error:', error);
        // Add delay after error
        await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_DELAY));
      }
    }
  }

  isProcessing = false;
};

export async function analyzeSEO(title: string, description: string, tags: string[]): Promise<SEOAnalysis> {
  return new Promise((resolve, reject) => {
    const request = async () => {
      const cacheKey = `${title}-${description}-${tags.join(',')}`;
      if (seoCache.has(cacheKey)) {
        resolve(seoCache.get(cacheKey)!);
        return;
      }

      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          const response = await aiService.generateContent(`Analyze this YouTube video content for SEO optimization...`);
          const data = tryParseJson(response, {}) as SEOAnalysis;

          if (!data || typeof data.score !== 'number') {
            throw new Error('Invalid SEO analysis data structure');
          }

          seoCache.set(cacheKey, data);
          resolve(data);
          return;
        } catch (error: any) {
          const isRateLimit = 
            error.message?.includes('Rate limit') || 
            error.status === 429 ||
            error.response?.status === 429;

          if (isRateLimit) {
            console.warn(`Rate limit hit, attempt ${retryCount + 1}/${maxRetries}`);
            const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 30000);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            retryCount++;
            continue;
          }

          if (retryCount < maxRetries - 1) {
            console.warn(`Retrying after error: ${error.message}`);
            retryCount++;
            continue;
          }

          console.error('Error analyzing SEO:', error);
          reject(error);
          return;
        }
      }

      reject(new Error('Failed to analyze SEO after multiple retries'));
    };

    requestQueue.push(request);
    processQueue();
  });
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

  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
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
        if (response.status === 429) {
          console.warn('Rate limit exceeded. Retrying...');
          await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retryCount))); // Exponential backoff
          retryCount++;
          continue;
        }
        const error = await response.text();
        console.error('Cohere API Error:', error);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
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
      if (retryCount >= maxRetries - 1) {
        console.error('Error optimizing metadata:', error);
        throw new Error(error.message || 'Failed to optimize metadata');
      }
      retryCount++;
    }
  }

  throw new Error('Failed to optimize metadata after multiple retries');
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