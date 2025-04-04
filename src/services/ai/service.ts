import { useAPIKeyStore } from '../../store/apiKeyStore';
import { AI_PROVIDERS } from '../../config/aiProviders';
import { validateSEOAnalysis } from '../../utils/json';

class AIService {
  private currentProvider: 'cohere' | 'openai' | 'huggingface' | 'openrouter' = 'cohere';
  private retryCount: number = 0;
  private maxRetries: number = 3;

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
      const jsonMatch = rawString.match(/{[\s\S]*}/); // Match the first JSON object in the string
      if (!jsonMatch) {
        throw new Error('No valid JSON object found');
      }
      return jsonMatch[0]; // Return the matched JSON object
    } catch (error) {
      console.error('Error sanitizing JSON string:', error);
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

  private formatSEOResponse(text: string): any {
    try {
      const response = JSON.parse(text);
      // Ensure response matches expected format
      if (!validateSEOAnalysis(response)) {
        // Convert unstructured response to proper format
        return {
          score: 0,
          titleAnalysis: {
            score: 0,
            suggestions: [text]
          },
          descriptionAnalysis: {
            score: 0,
            suggestions: []
          },
          tagsAnalysis: {
            score: 0,
            suggestions: []
          }
        };
      }
      return response;
    } catch (error) {
      console.error('Error formatting SEO response:', error);
      throw new Error('Invalid SEO analysis format');
    }
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
    try {
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
              score: { type: 'number' },
              titleAnalysis: {
                type: 'object',
                properties: {
                  score: { type: 'number' },
                  suggestions: { type: 'array', items: { type: 'string' } }
                }
              },
              descriptionAnalysis: {
                type: 'object',
                properties: {
                  score: { type: 'number' },
                  suggestions: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Cohere API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.generations?.[0]?.text;
      return this.formatSEOResponse(text);
    } catch (error) {
      console.error('Error with Cohere API:', error);
      throw error;
    }
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

  private async handleRateLimit(error: any, provider: string, prompt: string): Promise<string> {
    const providers: Array<'cohere' | 'openai' | 'huggingface' | 'openrouter'> = ['cohere', 'openai', 'huggingface', 'openrouter'];
    const currentIndex = providers.indexOf(provider as 'cohere' | 'openai' | 'huggingface' | 'openrouter');
    const nextProvider = providers[(currentIndex + 1) % providers.length];

    console.log(`Rate limited on ${provider}, switching to ${nextProvider}...`);

    const { getKey } = useAPIKeyStore.getState();
    const nextApiKey = getKey(nextProvider);

    if (!nextApiKey) {
      throw new Error(`No API key available for ${nextProvider}. Please configure in settings.`);
    }

    this.currentProvider = nextProvider; // Assign validated provider

    // Add exponential backoff
    const backoffTime = Math.min(1000 * Math.pow(2, this.retryCount), 10000);
    await new Promise(resolve => setTimeout(resolve, backoffTime));
    this.retryCount++;

    return this.generateContent(prompt); // Retry with new provider
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