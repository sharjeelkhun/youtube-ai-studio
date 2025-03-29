import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseAIProvider } from './base';
import { RateLimiter } from '../../../utils/rateLimiter';

export class GeminiProvider extends BaseAIProvider {
  private client: GoogleGenerativeAI | null = null;
  private rateLimiter: RateLimiter;

  constructor() {
    super();
    this.rateLimiter = new RateLimiter(60); // 60 requests per minute
  }

  initialize(apiKey: string): void {
    if (!apiKey) throw new Error('Gemini API key is required');
    super.initialize(apiKey);
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async generateContent(prompt: string): Promise<string> {
    if (!this.client) {
      throw new Error('Gemini API not initialized');
    }

    return this.rateLimiter.execute(async () => {
      try {
        const model = this.client!.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (error: any) {
        throw new Error(error.message || 'Gemini API request failed');
      }
    });
  }
}