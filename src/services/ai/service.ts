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
      // Extract JSON from text response
      const jsonRegex = /\{(?:[^{}]|{[^{}]*})*\}/g;
      const matches = rawString.match(jsonRegex);
      
      if (!matches) {
        throw new Error('No JSON object found in response');
      }

      // Try each matched JSON object
      for (const match of matches) {
        try {
          const cleaned = match
            .replace(/[\n\r\t]/g, ' ')
            .replace(/,\s*([\]}])/g, '$1')
            .replace(/:\s*,/g, ': null,')
            .replace(/\[\s*,/g, '[')
            .replace(/,\s*\]/g, ']');
          
          // Validate JSON structure
          const parsed = JSON.parse(cleaned);
          if (this.validateSEOFormat(parsed)) {
            return JSON.stringify(parsed);
          }
        } catch (e) {
          continue; // Try next match if this one fails
        }
      }
      throw new Error('No valid SEO JSON found in response');
    } catch (error) {
      console.error('Error sanitizing JSON:', error, 'Raw:', rawString);
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
      // Try parsing direct JSON first
      try {
        const parsed = JSON.parse(text);
        if (this.validateSEOFormat(parsed)) {
          return this.normalizeSEOScores(parsed);
        }
      } catch (e) {
        // Continue to next attempt if direct parse fails
      }

      // Try extracting JSON from text
      const sanitized = this.sanitizeJsonString(text);
      const extracted = JSON.parse(sanitized);
      if (this.validateSEOFormat(extracted)) {
        return this.normalizeSEOScores(extracted);
      }

      // If both attempts fail, create fallback response
      console.warn('Using fallback SEO response');
      return this.createFallbackSEOResponse(text);
    } catch (error) {
      console.error('Error formatting SEO response:', error);
      console.debug('Raw text:', text);
      return {
        ...DEFAULT_SEO_ANALYSIS,
        score: 50, // Default score instead of 0
        titleAnalysis: {
          score: 50,
          suggestions: ['Could not analyze title']
        },
        descriptionAnalysis: {
          score: 50,
          suggestions: ['Could not analyze description']
        },
        tagsAnalysis: {
          score: 50,
          suggestions: ['Could not analyze tags']
        },
        overallSuggestions: ['Analysis failed, using default values']
      };
    }
  }

  private validateSEOFormat(data: any): boolean {
    if (!data || typeof data !== 'object') return false;

    // Check required structure
    const hasRequiredFields = 
      'score' in data &&
      'titleAnalysis' in data &&
      'descriptionAnalysis' in data &&
      'tagsAnalysis' in data;

    if (!hasRequiredFields) return false;

    // Validate scores
    const hasValidScores = 
      (typeof data.score === 'number' || data.score === null) &&
      (typeof data.titleAnalysis?.score === 'number' || data.titleAnalysis?.score === null) &&
      (typeof data.descriptionAnalysis?.score === 'number' || data.descriptionAnalysis?.score === null) &&
      (typeof data.tagsAnalysis?.score === 'number' || data.tagsAnalysis?.score === null);

    // Validate suggestions arrays
    const hasValidSuggestions = 
      Array.isArray(data.titleAnalysis?.suggestions) &&
      Array.isArray(data.descriptionAnalysis?.suggestions) &&
      Array.isArray(data.tagsAnalysis?.suggestions);

    return hasValidScores && hasValidSuggestions;
  }

  private normalizeSEOScores(analysis: SEOAnalysis): SEOAnalysis {
    const normalizeScore = (score: number | null): number => {
      if (score === null || isNaN(score)) return 50;
      return Math.min(Math.max(Math.round(score), 0), 100);
    };

    return {
      score: normalizeScore(analysis.score),
      titleAnalysis: {
        score: normalizeScore(analysis.titleAnalysis?.score),
        suggestions: analysis.titleAnalysis?.suggestions || []
      },
      descriptionAnalysis: {
        score: normalizeScore(analysis.descriptionAnalysis?.score),
        suggestions: analysis.descriptionAnalysis?.suggestions || []
      },
      tagsAnalysis: {
        score: normalizeScore(analysis.tagsAnalysis?.score),
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

        // Format the prompt to force JSON response
        const formattedPrompt = `${prompt}\n\nRespond ONLY with a JSON object in this exact format:
        {
          "score": number,
          "titleAnalysis": {
            "score": number,
            "suggestions": string[]
          },
          "descriptionAnalysis": {
            "score": number,
            "suggestions": string[]
          },
          "tagsAnalysis": {
            "score": number,
            "suggestions": string[]
          }
        }`;

        const response = await fetch(`${AI_PROVIDERS.COHERE.baseUrl}/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'Cohere-Version': '2022-12-06'
          },
          body: JSON.stringify({
            model: 'command',
            prompt: formattedPrompt,
            max_tokens: 2000,
            temperature: 0.3, // Lower temperature for more structured output
            format: 'json',
            truncate: 'END',
            return_likelihoods: 'NONE'
          })
        });

        if (response.status === 429) {
          throw new Error('Rate limit exceeded');
        }

        if (!response.ok) {
          throw new Error(`Cohere API error: ${response.status}`);
        }

        const data = await response.json();
        if (!data.generations?.[0]?.text) {
          throw new Error('Empty response from Cohere');
        }

        // Try to extract JSON from the response
        const text = data.generations[0].text.trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No valid JSON found in response');
        }

        return jsonMatch[0];
      } catch (error: any) {
        if (error.message.includes('Rate limit')) {
          console.warn('Rate limit hit, retrying with backoff...');
          await this.handleRateLimit('cohere', prompt);
        }
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
      throw new Error('Rate limit exceeded after max retries');
    }

    // Try next provider
    const providers = ['cohere', 'openai', 'huggingface', 'openrouter'] as const;
    const nextProvider = providers[(providers.indexOf(currentProvider as any) + 1) % providers.length];
    
    if (this.setProvider(nextProvider)) {
      console.log(`Switching to ${nextProvider}`);
      return this.generateContent(prompt);
    }

    throw new Error('No alternative providers available');
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