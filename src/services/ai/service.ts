import { useAPIKeyStore } from '../../store/apiKeyStore';
import { AI_PROVIDERS } from '../../config/aiProviders';
import { sanitizeJsonString, tryParseJson } from '../../utils/json';
import { SEOAnalysis } from '../../types/seo';
import { RateLimiter } from '../../utils/rateLimiter';

const DEFAULT_SEO_ANALYSIS: SEOAnalysis = {
  score: 0,
  titleAnalysis: {
    score: 0,
    suggestions: []
  },
  descriptionAnalysis: {
    score: 0,
    suggestions: []
  },
  tagsAnalysis: {
    score: 0,
    suggestions: []
  },
  overallSuggestions: []
};

class AIService {
  private currentProvider: 'cohere' | 'openai' | 'huggingface' | 'openrouter' = 'cohere';
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private rateLimiter: RateLimiter;

  constructor() {
    // Allow 5 requests per minute
    this.rateLimiter = new RateLimiter(5);
  }

  getCurrentProvider(): string {
    return this.currentProvider;
  }

  hasActiveProvider(): boolean {
    const { getKey } = useAPIKeyStore.getState();
    return !!getKey(this.currentProvider);
  }

  setProvider(provider: 'cohere' | 'openai' | 'huggingface' | 'openrouter'): boolean {
    const { getKey } = useAPIKeyStore.getState();
    const apiKey = getKey(provider);

    if (!apiKey) {
      console.error(`No API key found for ${provider}`);
      return false;
    }

    this.currentProvider = provider; // Ensure the selected provider is updated
    console.log(`Switched to provider: ${provider}`);
    return true;
  }

  async generateContent(prompt: string): Promise<string> {
    const { getKey } = useAPIKeyStore.getState();
    const apiKey = getKey(this.currentProvider);

    if (!apiKey) {
      throw new Error(`No API key configured for the selected provider: ${this.currentProvider}`);
    }

    try {
      return await this.tryProvider(this.currentProvider, prompt);
    } catch (error) {
      console.error(`Error with ${this.currentProvider}:`, error);
      throw new Error(`Failed to generate content using ${this.currentProvider}`);
    }
  }

  private sanitizeJsonString(rawString: string): string {
    try {
      if (typeof rawString !== 'string') {
        throw new Error('Input must be a string');
      }

      // Remove any leading/trailing non-JSON content
      const jsonStart = rawString.indexOf('{');
      const jsonEnd = rawString.lastIndexOf('}');
      
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('No JSON object found in string');
      }

      const jsonStr = rawString.slice(jsonStart, jsonEnd + 1);
      
      // Validate JSON structure
      JSON.parse(jsonStr); // Will throw if invalid
      return jsonStr;
    } catch (error) {
      console.error('Error sanitizing JSON:', error);
      console.debug('Raw input:', rawString);
      throw new Error('Failed to sanitize JSON string');
    }
  }

  private tryParseJson<T>(jsonString: string, fallback: T): T {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('JSON Parse Error:', error);
      console.error('Raw Response:', jsonString); // Log raw response for debugging
      return fallback;
    }
  }

  private formatSEOResponse(text: string): SEOAnalysis {
    try {
      // First try parsing as direct JSON
      const parsed = tryParseJson<SEOAnalysis>(text, DEFAULT_SEO_ANALYSIS);
      if (parsed && this.validateSEOFormat(parsed)) {
        return this.normalizeSEOScores(parsed);
      }

      // If direct parse fails, try to extract JSON
      const sanitized = sanitizeJsonString(text);
      const extracted = tryParseJson<SEOAnalysis>(sanitized, DEFAULT_SEO_ANALYSIS);
      if (extracted && this.validateSEOFormat(extracted)) {
        return this.normalizeSEOScores(extracted);
      }

      // If both attempts fail, create a fallback response
      return this.createFallbackSEOResponse(text);
    } catch (error) {
      console.error('Error formatting SEO response:', error);
      return DEFAULT_SEO_ANALYSIS;
    }
  }

  private validateSEOFormat(data: any): boolean {
    if (!data || typeof data !== 'object') return false;

    const hasValidScores = 
      (typeof data.score === 'number' || data.score === null) &&
      data.titleAnalysis?.score !== undefined &&
      data.descriptionAnalysis?.score !== undefined &&
      data.tagsAnalysis?.score !== undefined;

    const hasValidSuggestions = 
      Array.isArray(data.titleAnalysis?.suggestions) &&
      Array.isArray(data.descriptionAnalysis?.suggestions) &&
      Array.isArray(data.tagsAnalysis?.suggestions);

    return hasValidScores && hasValidSuggestions;
  }

  private normalizeSEOScores(analysis: SEOAnalysis): SEOAnalysis {
    return {
      score: analysis.score || 0,
      titleAnalysis: {
        score: analysis.titleAnalysis?.score || 0,
        suggestions: analysis.titleAnalysis?.suggestions || []
      },
      descriptionAnalysis: {
        score: analysis.descriptionAnalysis?.score || 0,
        suggestions: analysis.descriptionAnalysis?.suggestions || []
      },
      tagsAnalysis: {
        score: analysis.tagsAnalysis?.score || 0,
        suggestions: analysis.tagsAnalysis?.suggestions || []
      },
      overallSuggestions: analysis.overallSuggestions || []
    };
  }

  private createFallbackSEOResponse(text: string): SEOAnalysis {
    const lines = text.split('\n').filter(line => line.trim());
    const suggestions = {
      title: lines.filter(line => 
        line.toLowerCase().includes('title') || 
        line.toLowerCase().includes('headline')
      ),
      description: lines.filter(line => 
        line.toLowerCase().includes('description') || 
        line.toLowerCase().includes('content')
      ),
      tags: lines.filter(line =>
        line.toLowerCase().includes('tag') ||
        line.toLowerCase().includes('keyword')
      )
    };

    return {
      score: 0,
      titleAnalysis: {
        score: suggestions.title.length > 0 ? 50 : 0,
        suggestions: suggestions.title
      },
      descriptionAnalysis: {
        score: suggestions.description.length > 0 ? 50 : 0,
        suggestions: suggestions.description
      },
      tagsAnalysis: {
        score: suggestions.tags.length > 0 ? 50 : 0,
        suggestions: suggestions.tags
      },
      overallSuggestions: lines.filter(line => 
        !suggestions.title.includes(line) &&
        !suggestions.description.includes(line) &&
        !suggestions.tags.includes(line)
      )
    };
  }

  private async tryProvider(provider: string, prompt: string): Promise<string> {
    const { getKey } = useAPIKeyStore.getState();
    const apiKey = getKey(provider);

    if (!apiKey) {
      console.log(`No API key for ${provider}, skipping...`);
      return '';
    }

    switch (provider) {
      case 'cohere':
        return this.generateWithCohere(prompt, apiKey);
      case 'openai':
        return this.generateWithOpenAI(prompt, apiKey);
      case 'huggingface':
        return this.generateWithHuggingFace(prompt, apiKey);
      case 'openrouter':
        return this.generateWithOpenRouter(prompt, apiKey);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  private async generateWithCohere(prompt: string, apiKey: string): Promise<string> {
    return this.rateLimiter.execute(async () => {
      try {
        console.log('Sending optimization request to Cohere...');
        const response = await fetch(`${AI_PROVIDERS.COHERE.baseUrl}/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'Cohere-Version': '2022-12-06'
          },
          body: JSON.stringify({
            model: 'command',
            prompt,
            max_tokens: 1000,
            temperature: 0.7,
            format: 'json',
            json_schema: {
              type: 'object',
              required: ['score', 'titleAnalysis', 'descriptionAnalysis'],
              properties: {
                score: { type: ['number', 'null'] },
                titleAnalysis: {
                  type: 'object',
                  required: ['score', 'suggestions'],
                  properties: {
                    score: { type: ['number', 'null'] },
                    suggestions: { type: 'array', items: { type: 'string' } }
                  }
                },
                descriptionAnalysis: {
                  type: 'object',
                  required: ['score', 'suggestions'],
                  properties: {
                    score: { type: ['number', 'null'] },
                    suggestions: { type: 'array', items: { type: 'string' } }
                  }
                }
              }
            }
          })
        });

        if (response.status === 429) {
          throw new Error('Rate limit exceeded');
        }

        if (!response.ok) {
          throw new Error(`Cohere API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('Raw AI Response:', data);
        const text = data.generations?.[0]?.text;
        console.log('Generated Text:', text);
        
        if (!text) {
          throw new Error('Empty response from Cohere');
        }

        return text;
      } catch (error: any) {
        if (error.message.includes('Rate limit')) {
          await this.handleRateLimit('cohere', prompt);
        }
        console.error('Error with Cohere API:', error);
        throw error;
      }
    });
  }

  private async generateWithOpenAI(prompt: string, apiKey: string): Promise<string> {
    const response = await fetch(`${AI_PROVIDERS.OPENAI.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async generateWithHuggingFace(prompt: string, apiKey: string): Promise<string> {
    try {
      const response = await fetch('https://api-inference.huggingface.co/models/facebook/opt-1.3b', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: 1000,
            temperature: 0.7,
            return_full_text: false,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HuggingFace API error: ${response.status}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data[0].generated_text : data.generated_text;
    } catch (error) {
      console.error('Error with HuggingFace API:', error);
      throw error;
    }
  }

  private async generateWithOpenRouter(prompt: string, apiKey: string): Promise<string> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-3.5-turbo',
          prompt,
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.text || '';
    } catch (error) {
      console.error('Error with OpenRouter API:', error);
      throw error;
    }
  }

  private async handleRateLimit(currentProvider: string, prompt: string): Promise<string> {
    const backoffTime = Math.min(1000 * Math.pow(2, this.retryCount), 30000);
    console.warn(`Rate limit hit for ${currentProvider}, waiting ${backoffTime}ms`);
    await new Promise(resolve => setTimeout(resolve, backoffTime));
    this.retryCount++;

    if (this.retryCount >= this.maxRetries) {
      this.retryCount = 0;
      throw new Error('Max retries exceeded');
    }

    return this.generateContent(prompt);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getTokenUsage(provider: 'cohere' | 'openai' | 'huggingface' | 'openrouter'): Promise<number | null> {
    // Skip token usage check for unsupported providers
    if (['huggingface', 'openrouter'].includes(provider)) {
      console.warn(`${provider} does not support token usage API`);
      return null;
    }

    const { getKey } = useAPIKeyStore.getState();
    const apiKey = getKey(provider);

    if (!apiKey) {
      console.warn(`No API key found for ${provider}`);
      return null;
    }

    try {
      switch (provider) {
        case 'cohere':
          // Cohere does not have a token usage endpoint
          return null;

        case 'openai':
          const response = await fetch('https://api.openai.com/v1/usage', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
          });
          if (!response.ok) return null;
          const data = await response.json();
          return data.total_available || null;

        default:
          return null;
      }
    } catch (error) {
      console.error(`Error fetching token usage for ${provider}:`, error);
      return null;
    }
  }
}

export const aiService = new AIService();