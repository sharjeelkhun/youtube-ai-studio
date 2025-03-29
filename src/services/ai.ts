import { aiService } from './ai/service';
import toast from 'react-hot-toast';
import { SEOAnalysis } from '../types/seo';
import { useAPIKeyStore } from '../store/apiKeyStore';
import { tryParseJson } from '../utils/json';

const seoCache = new Map<string, SEOAnalysis>();

export async function analyzeSEO(title: string, description: string, tags: string[]): Promise<SEOAnalysis> {
  const { getKey } = useAPIKeyStore.getState();
  const cohereKey = getKey('cohere');

  if (!cohereKey) {
    console.warn('No Cohere API key configured');
    throw new Error('Please configure your Cohere API key in Settings');
  }

  const cacheKey = `${title}-${description}-${tags.join(',')}`;
  
  if (seoCache.has(cacheKey)) {
    return seoCache.get(cacheKey)!;
  }

  const prompt = `Analyze this YouTube video metadata and provide a detailed SEO analysis with specific scores and suggestions. Return a JSON object with the following structure:

Video Details:
Title: "${title}"
Description: "${description}"
Tags: ${tags.join(', ')}

Analyze the following aspects and provide specific scores (0-100) and actionable suggestions:
1. Title effectiveness (keywords, length, engagement)
2. Description quality (detail, keywords, formatting)
3. Tags relevance and coverage
4. Overall SEO optimization

Return ONLY a JSON object with this exact structure:
{
  "score": number,
  "titleAnalysis": {
    "score": number,
    "suggestions": [string, string, string]
  },
  "descriptionAnalysis": {
    "score": number,
    "suggestions": [string, string, string]
  },
  "tagsAnalysis": {
    "score": number,
    "suggestions": [string, string, string]
  },
  "overallSuggestions": [string, string, string]
}`;

  try {
    const response = await aiService.generateContent(prompt);
    const analysis = tryParseJson<SEOAnalysis>(response, {
      score: 0,
      titleAnalysis: { score: 0, suggestions: [] },
      descriptionAnalysis: { score: 0, suggestions: [] },
      tagsAnalysis: { score: 0, suggestions: [] },
      overallSuggestions: []
    });
    
    // Validate and sanitize scores
    const sanitizedAnalysis: SEOAnalysis = {
      score: Math.min(100, Math.max(0, Number(analysis.score) || 0)),
      titleAnalysis: {
        score: Math.min(100, Math.max(0, Number(analysis.titleAnalysis?.score) || 0)),
        suggestions: Array.isArray(analysis.titleAnalysis?.suggestions) 
          ? analysis.titleAnalysis.suggestions
              .filter(s => typeof s === 'string' && s.trim())
              .map(s => s.trim())
              .slice(0, 3)
          : []
      },
      descriptionAnalysis: {
        score: Math.min(100, Math.max(0, Number(analysis.descriptionAnalysis?.score) || 0)),
        suggestions: Array.isArray(analysis.descriptionAnalysis?.suggestions)
          ? analysis.descriptionAnalysis.suggestions
              .filter(s => typeof s === 'string' && s.trim())
              .map(s => s.trim())
              .slice(0, 3)
          : []
      },
      tagsAnalysis: {
        score: Math.min(100, Math.max(0, Number(analysis.tagsAnalysis?.score) || 0)),
        suggestions: Array.isArray(analysis.tagsAnalysis?.suggestions)
          ? analysis.tagsAnalysis.suggestions
              .filter(s => typeof s === 'string' && s.trim())
              .map(s => s.trim())
              .slice(0, 3)
          : []
      },
      overallSuggestions: Array.isArray(analysis.overallSuggestions)
        ? analysis.overallSuggestions
            .filter(s => typeof s === 'string' && s.trim())
            .map(s => s.trim())
            .slice(0, 3)
        : []
    };

    seoCache.set(cacheKey, sanitizedAnalysis);
    return sanitizedAnalysis;
  } catch (error: any) {
    console.error('Error analyzing SEO:', error);
    throw error;
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