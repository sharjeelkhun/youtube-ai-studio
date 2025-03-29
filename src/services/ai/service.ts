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
    
    while (attempts < providers.length) {
      try {
        const currentProvider = providers[attempts];
        console.log(`Trying provider: ${currentProvider}`);
        
        const response = await this.tryProvider(currentProvider, prompt);
        if (response) {
          this.currentProvider = currentProvider; // Update current provider if successful
          return response;
        }
      } catch (error: any) {
        console.error(`Error with ${providers[attempts]}:`, error);
        
        if (error.message.includes('429') || error.message.includes('Rate limit')) {
          attempts++;
          if (attempts < providers.length) {
            console.log(`Switching to next provider: ${providers[attempts]}`);
            continue;
          }
        }
        throw error;
      }
      attempts++;
    }
    
    throw new Error('All AI providers failed or are rate limited. Please try again later.');
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
}

export const aiService = new AIService();