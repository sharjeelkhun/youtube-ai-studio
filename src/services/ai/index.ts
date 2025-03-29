import { GeminiProvider } from './providers/gemini';
import { OpenAIProvider } from './providers/openai';
import { HuggingFaceProvider } from './providers/huggingface';
import { CohereProvider } from './providers/cohere';
import { AIProvider, AIProviderType } from './types';
import { useAPIKeyStore } from '../../store/apiKeyStore';

class AIService {
  private provider: AIProvider | null = null;
  private providerType: AIProviderType | null = null;

  constructor() {
    this.initializeProvider();
  }

  private initializeProvider() {
    const { getKey } = useAPIKeyStore.getState();
    
    // Try to initialize providers in order of preference
    if (getKey('gemini')) {
      this.provider = new GeminiProvider(getKey('gemini'));
      this.providerType = 'gemini';
    } else if (getKey('openai')) {
      this.provider = new OpenAIProvider(getKey('openai'));
      this.providerType = 'openai';
    } else if (getKey('huggingface')) {
      this.provider = new HuggingFaceProvider(getKey('huggingface'));
      this.providerType = 'huggingface';
    } else if (getKey('cohere')) {
      this.provider = new CohereProvider(getKey('cohere'));
      this.providerType = 'cohere';
    }
  }

  // ... rest of the service implementation remains the same
}

export const aiService = new AIService();