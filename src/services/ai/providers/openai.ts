import OpenAI from 'openai';
import { env } from '../../../config/env';
import { AIProvider, AIResponse } from '../types';
import { rateLimit } from '../utils';

export class OpenAIProvider implements AIProvider {
  private openai: OpenAI | null = null;

  constructor() {
    if (env.VITE_OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: env.VITE_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true
      });
    }
  }

  async analyze(prompt: string): Promise<AIResponse> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    return rateLimit(async () => {
      const completion = await this.openai!.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-3.5-turbo'
      });
      return { text: completion.choices[0].message.content || '' };
    });
  }
}