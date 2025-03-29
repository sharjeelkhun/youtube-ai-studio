import { useEffect } from 'react';
import { useAPIKeyStore } from '../store/apiKeyStore';
import { aiService } from '../services/ai/service';

export function useAIProvider() {
  const { getKey } = useAPIKeyStore();

  useEffect(() => {
    // Initialize AI provider if not already initialized
    if (!aiService.hasActiveProvider()) {
      const geminiKey = getKey('gemini');
      const cohereKey = getKey('cohere');

      if (geminiKey) {
        aiService.setProvider('gemini');
      } else if (cohereKey) {
        aiService.setProvider('cohere');
      }
    }
  }, [getKey]);

  return aiService;
}