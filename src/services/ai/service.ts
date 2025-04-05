import { useAPIKeyStore } from '../../store/apiKeyStore';
import { AI_PROVIDERS } from '../../config/aiProviders';

class AIService {
  private currentProvider: string = 'cohere';
  private retryCount: number = 0;
  private maxRetries: number = 3;

  getCurrentProvider(): string {
    return this.currentProvider;
  }

  hasActiveProvider(): boolean {
    const { getKey } = useAPIKeyStore.getState();
    return !!getKey(this.currentProvider);
  }

  setProvider(provider: 'cohere' | 'openai' | 'huggingface'): boolean {
    try {
      const { getKey } = useAPIKeyStore.getState();
      const apiKey = getKey(provider);
      
      if (!apiKey) {
        console.error(`No API key found for ${provider}`);
        return false;
      }

      this.currentProvider = provider;
      return true;
    } catch (error) {
      console.error('Error setting provider:', error);
      return false;
    }
  }

  async generateContent(prompt: string): Promise<string> {
    const providers = ['cohere', 'openai', 'huggingface'];
    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < this.maxRetries * providers.length) {
      const provider = providers[attempts % providers.length];
      try {
        console.log(`Attempting with provider: ${provider} (attempt ${attempts + 1})`);
        const response = await this.tryProvider(provider, prompt);

        if (!response) {
          throw new Error(`Empty response from ${provider}`);
        }

        const parsedResponse = this.tryParseJson<{ text: string }>(response, { text: '' });
        if (parsedResponse.text) {
          this.currentProvider = provider; // Update current provider if successful
          return parsedResponse.text;
        } else {
          throw new Error(`Invalid response structure from ${provider}`);
        }
      } catch (error: any) {
        console.error(`Error with ${provider}:`, error);
        lastError = error;

        if (error.message.includes('429') || error.message.includes('Rate limit')) {
          console.log(`Rate limit hit for ${provider}. Retrying after delay...`);
          await this.delay(1000); // Delay before retrying
        } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
          console.log(`Invalid API key for ${provider}. Skipping to next provider...`);
        } else {
          console.log(`Unhandled error with ${provider}. Retrying with next provider...`);
        }

        attempts++;
      }
    }

    throw lastError || new Error('All AI providers failed or are rate limited. Please try again later.');
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
      return fallback;
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
        },
        body: JSON.stringify({
          model: 'command',
          prompt,
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`Cohere API error: ${response.status}`);
      }

      const data = await response.json();
      return data.generations[0].text;
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

  private async handleRateLimit(error: any, provider: string, prompt: string): Promise<string> {
    const providers = ['cohere', 'openai', 'huggingface'];
    const currentIndex = providers.indexOf(provider);
    const nextProvider = providers[(currentIndex + 1) % providers.length];
    
    console.log(`Rate limited on ${provider}, switching to ${nextProvider}...`);
    
    const { getKey } = useAPIKeyStore.getState();
    const nextApiKey = getKey(nextProvider);
    
    if (!nextApiKey) {
      throw new Error(`No API key available for ${nextProvider}. Please configure in settings.`);
    }
    
    this.currentProvider = nextProvider;
    
    // Add exponential backoff
    const backoffTime = Math.min(1000 * Math.pow(2, this.retryCount), 10000);
    await new Promise(resolve => setTimeout(resolve, backoffTime));
    this.retryCount++;
    
    return this.generateContent(prompt); // Retry with new provider
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const aiService = new AIService();