import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import toast from 'react-hot-toast';

const genAI = new GoogleGenerativeAI(env.VITE_GEMINI_API_KEY);

export async function analyzeSEO(title: string, description: string, tags: string[]) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `As a YouTube SEO expert, analyze this video metadata and provide specific, actionable suggestions for improvement:

Title: ${title}
Description: ${description}
Tags: ${tags.join(', ')}

Focus on:
1. Title optimization (keywords, length, engagement)
2. Description effectiveness (first 2-3 lines, keywords, links)
3. Tag relevance and coverage
4. Overall SEO score (1-10)
5. Specific recommendations for improvement

Format the response in clear sections with bullet points.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error analyzing SEO:', error);
    toast.error('Failed to analyze SEO. Please check your Gemini API key.');
    throw error;
  }
}

export async function getVideoSuggestions(videoData: {
  title: string;
  description: string;
  views: string;
  likes: string;
}) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `As a YouTube content optimization expert, analyze this video's performance and provide specific suggestions for improvement:

Title: ${videoData.title}
Description: ${videoData.description}
Views: ${videoData.views}
Likes: ${videoData.likes}

Provide recommendations for:
1. Title optimization
2. Description enhancement
3. Thumbnail suggestions
4. Content engagement strategies
5. Call-to-action improvements

Format the response in clear sections with actionable bullet points.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error getting video suggestions:', error);
    toast.error('Failed to generate video suggestions');
    throw error;
  }
}