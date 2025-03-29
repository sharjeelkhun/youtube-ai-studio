export interface AIResponse {
  text: string;
}

export interface AIProvider {
  analyze(prompt: string): Promise<AIResponse>;
}

export type AIProviderType = 'gemini' | 'openai' | 'huggingface' | 'cohere';