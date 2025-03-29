export const AI_PROVIDERS = {
  COHERE: {
    name: 'Cohere',
    baseUrl: 'https://api.cohere.ai/v1',
    freeTier: '5M tokens per month',
  },
  OPENAI: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    freeTier: '3M tokens per month',
  },
  HUGGINGFACE: {
    name: 'HuggingFace',
    baseUrl: 'https://api-inference.huggingface.co/models',
    freeTier: 'Free tier available',
  },
};
