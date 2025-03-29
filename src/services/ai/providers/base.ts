export interface AIProvider {
  initialize: (apiKey: string) => void;
  isConfigured: () => boolean;
  generateContent: (prompt: string) => Promise<string>;
}

export class BaseAIProvider implements AIProvider {
  protected apiKey: string | null = null;

  initialize(apiKey: string) {
    this.apiKey = apiKey;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async generateContent(_prompt: string): Promise<string> {
    throw new Error('Method not implemented');
  }
}