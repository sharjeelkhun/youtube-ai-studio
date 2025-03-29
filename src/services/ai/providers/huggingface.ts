import { env } from '../../../config/env';
import { AIProvider, AIResponse } from '../types';
import { rateLimit } from '../utils';

export class HuggingFaceProvider implements AIProvider {
  private apiKey: string | null = null;

  constructor() {
    this.apiKey = env.VITE_HUGGINGFACE_API_KEY || null;
  }

  async analyze(prompt: string): Promise<AIResponse> {
    if (!this.apiKey) {
      throw new Error('HuggingFace API key not configured');
    }

    return rateLimit(async () => {
      const response = await fetch(
        'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ inputs: prompt })
        }
      );

      if (!response.ok) {
        throw new Error('HuggingFace API request failed');
      }

      const result = await response.json();
      return { text: result[0].generated_text };
    });
  }
}