import OpenAI from 'openai';
import { env, checkRequiredEnv } from '../config/env';
import toast from 'react-hot-toast';

let openai: OpenAI | null = null;

try {
  if (checkRequiredEnv('openai')) {
    openai = new OpenAI({
      apiKey: env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });
  }
} catch (error) {
  console.error('Failed to initialize OpenAI:', error);
}

export async function analyzeSEO(title: string, description: string, tags: string[]) {
  if (!openai) {
    toast.error('OpenAI API key is not configured');
    throw new Error('OpenAI API key is required');
  }

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a YouTube SEO expert. Analyze the video metadata and provide specific, actionable suggestions for improvement. Focus on:
            1. Title optimization
            2. Description effectiveness
            3. Tag relevance and coverage
            4. Overall SEO score
            5. Specific recommendations for improvement`
        },
        {
          role: 'user',
          content: `
            Please analyze this YouTube video metadata:
            
            Title: ${title}
            Description: ${description}
            Tags: ${tags.join(', ')}
            
            Provide a detailed analysis with specific suggestions for improvement.
          `
        }
      ],
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 1000
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error analyzing SEO:', error);
    toast.error('Failed to analyze SEO. Please check your OpenAI API key.');
    throw error;
  }
}