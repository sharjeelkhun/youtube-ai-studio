import { BaseAIProvider } from './base';
import { RateLimiter } from '../../../utils/rateLimiter';

export class CohereProvider extends BaseAIProvider {
  private rateLimiter: RateLimiter;

  constructor() {
    super();
    this.rateLimiter = new RateLimiter(100); // 100 requests per minute
  }

  initialize(apiKey: string): void {
    if (!apiKey) throw new Error('Cohere API key is required');
    super.initialize(apiKey);
  }

  async generateContent(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Cohere API not initialized');
    }

    return this.rateLimiter.execute(async () => {
      try {
        const response = await fetch('https://api.cohere.ai/v1/generate', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cohere-Version': '2022-12-06'
          },
          body: JSON.stringify({
            model: 'command',
            prompt,
            max_tokens: 4000,
            temperature: 0.7,
            k: 0,
            p: 0.75,
            frequency_penalty: 0.5,
            presence_penalty: 0.5,
            return_likelihoods: 'NONE',
            truncate: 'END',
            stream: false
          })
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Cohere API Error:', error);
          throw new Error(error.message || 'Cohere API request failed');
        }

        const data = await response.json();
        if (!data.generations?.[0]?.text) {
          throw new Error('Invalid response from Cohere API');
        }

        return data.generations[0].text.trim();
      } catch (error: any) {
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          throw new Error('Network error: Unable to connect to Cohere API');
        }
        console.error('Cohere API Error:', error);
        throw new Error(error.message || 'Cohere API request failed');
      }
    });
  }
}