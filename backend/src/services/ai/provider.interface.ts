/**
 * AI Provider Interface
 */

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIResponse {
  content: string;
  finishReason: string;
  tokensUsed?: number;
}

export interface AIConfig {
  model: string;
  apiKey: string;
  maxTokens?: number;
  temperature?: number;
}

export interface IAIProvider {
  chat(
    messages: AIMessage[],
    userContext?: string,
    imageBase64?: string,
    imageMimeType?: string
  ): Promise<AIResponse>;
  stream(
    messages: AIMessage[],
    userContext: string | undefined,
    onChunk: (delta: string) => void
  ): Promise<void>;
  getProviderName(): string;
  isConfigured(): boolean;
}

export default IAIProvider;
