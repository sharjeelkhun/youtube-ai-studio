import { aiService } from './ai/service';
import { SEOAnalysis, DEFAULT_SEO_ANALYSIS } from '../types/seo';
import { RateLimiter } from '../utils/rateLimiter';
import toast from 'react-hot-toast';

const rateLimiter = new RateLimiter(30); // 30 requests per minute
const seoCache = new Map<string, SEOAnalysis>();

export async function analyzeSEO(title: string, description: string, tags: string[]): Promise<SEOAnalysis> {
  const maxRetries = 3;
  let retryCount = 0;

  const analyzeWithRetry = async (): Promise<SEOAnalysis> => {
    try {
      return await rateLimiter.execute(async () => {
        const cacheKey = `${title}-${description}-${tags.join(',')}`;
        const cached = seoCache.get(cacheKey);
        if (cached?.timestamp && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
          return cached;
        }

        const result = await aiService.generateContent(`Analyze this YouTube video content for SEO optimization:
Title: ${title}
Description: ${description}
Tags: ${tags.join(', ')}

Provide a comprehensive SEO analysis with scores (0-100) and suggestions for:
1. Overall SEO score
2. Title optimization
3. Description effectiveness
4. Tag relevance and coverage
5. Viewer engagement potential

Format as JSON with scores and detailed suggestions.`);
        
        if (!result) {
          throw new Error('Failed to generate SEO analysis');
        }

        // Parse and validate the AI response
        const analysis: SEOAnalysis = {
          ...DEFAULT_SEO_ANALYSIS,
          score: 0,
          timestamp: Date.now()
        };

        try {
          const parsedResult = JSON.parse(result);
          if (parsedResult.score) {
            analysis.score = Math.min(Math.max(Math.round(parsedResult.score), 0), 100);
            // Copy over other analysis sections
            Object.assign(analysis, parsedResult);
          }
        } catch (e) {
          console.error('Error parsing AI response:', e);
        }

        // Cache the result
        seoCache.set(cacheKey, analysis);
        return analysis;
      });
    } catch (error: any) {
      if (error.message?.includes('Rate limit') && retryCount < maxRetries) {
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
        return analyzeWithRetry();
      }
      throw error;
    }
  };

  try {
    return await analyzeWithRetry();
  } catch (error: any) {
    toast.error('Failed to analyze SEO. Will try again later.');
    console.error('SEO Analysis error:', error);
    return DEFAULT_SEO_ANALYSIS;
  }
}
