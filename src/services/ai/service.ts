import { useAPIKeyStore } from '../../store/apiKeyStore';
import { AI_PROVIDERS } from '../../config/aiProviders';

class AIService {
  private currentProvider: string = 'cohere';
  private retryCount: number = 0;
  private maxRetries: number = 3;

  getCurrentProvider(): string {
    return this.currentProvider;
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
    
    for (const provider of providers) {
      try {
        const response = await this.tryProvider(provider, prompt);
        if (response) return response;
      } catch (error: any) {
        console.error(`Error with ${provider}:`, error);
        try {
          return await this.handleRateLimit(error, provider);
        } catch (rateLimitError) {
          console.error('Rate limit handling failed:', rateLimitError);
          throw rateLimitError;
        }
      }
    }
    
    throw new Error('All AI providers are rate limited. Please try again later.');
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
        return '';
    }
  }

  private async generateWithCohere(prompt: string, apiKey: string): Promise<string> {
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
    const response = await fetch(`${AI_PROVIDERS.HUGGINGFACE.baseUrl}/gpt2`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ inputs: prompt }),
    });

    if (!response.ok) {
      throw new Error(`HuggingFace API error: ${response.status}`);
    }

    const data = await response.json();
    return data[0].generated_text;
  }

  private async handleRateLimit(error: any, provider: string): Promise<string> {
    if (error.message.includes('Rate limit') || error.response?.status === 429) {
      // Try next provider
      const providers = ['cohere', 'openai', 'huggingface'];
      const currentIndex = providers.indexOf(provider);
      const nextProvider = providers[(currentIndex + 1) % providers.length];
      
      console.log(`Rate limited on ${provider}, trying ${nextProvider}...`);
      this.setProvider(nextProvider as 'cohere' | 'openai' | 'huggingface');
      
      // Add exponential backoff
      const backoffTime = Math.min(1000 * Math.pow(2, this.retryCount), 10000);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      this.retryCount++;
      
      if (this.retryCount > this.maxRetries) {
        this.retryCount = 0;
        throw new Error('Maximum retry attempts reached. Please try again later.');
      }
    }
    throw error;
  }
}

export const aiService = new AIService();