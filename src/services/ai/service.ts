import { CohereProvider } from './providers/cohere';
import { useAPIKeyStore } from '../../store/apiKeyStore';
import toast from 'react-hot-toast';

class AIService {
  private cohereProvider: CohereProvider;
  private currentProvider: 'cohere' | null = null;

  constructor() {
    this.cohereProvider = new CohereProvider();
    this.initializeProvider();
  }

  private initializeProvider() {
    const { getKey } = useAPIKeyStore.getState();
    const cohereKey = getKey('cohere');
    if (cohereKey) {
      this.setProvider('cohere');
    }
  }

  hasActiveProvider(): boolean {
    return this.currentProvider !== null;
  }

  getCurrentProvider(): 'cohere' | null {
    return this.currentProvider;
  }

  setProvider(provider: 'cohere'): boolean {
    const { getKey } = useAPIKeyStore.getState();
    const apiKey = getKey(provider);

    if (!apiKey) {
      toast.error(`Please configure your ${provider} API key in Settings`);
      return false;
    }

    try {
      this.cohereProvider.initialize(apiKey);
      this.currentProvider = provider;
      return true;
    } catch (error) {
      console.error(`Failed to initialize ${provider}:`, error);
      return false;
    }
  }

  async generateContent(prompt: string): Promise<string> {
    if (!this.currentProvider) {
      this.initializeProvider();
    }

    if (!this.hasActiveProvider()) {
      throw new Error('Please configure your Cohere API key in Settings');
    }

    try {
      return await this.cohereProvider.generateContent(prompt);
    } catch (error: any) {
      console.error('AI generation error:', error);
      throw new Error(error.message || 'Failed to generate content');
    }
  }
}

export const aiService = new AIService();