/**
 * Google Gemini Service Implementation
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { IAIProvider, AIMessage, AIResponse, AIConfig } from "./provider.interface";

export class GeminiService implements IAIProvider {
  private client: GoogleGenerativeAI;
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
    this.client = new GoogleGenerativeAI(config.apiKey);
  }

  async chat(
    messages: AIMessage[],
    userContext?: string,
    imageBase64?: string,
    imageMimeType?: string
  ): Promise<AIResponse> {
    try {
      const model = this.client.getGenerativeModel({ model: this.config.model });

      const systemPrompt = this.getSystemPrompt(userContext);
      const conversationHistory = messages
        .map((msg) => `${msg.role === "assistant" ? "model" : "user"}: ${msg.content}`)
        .join("\n\n");

      const fullPrompt = `${systemPrompt}\n\n=== Conversation ===\n${conversationHistory}`;

      type Part = { text: string } | { inlineData: { mimeType: string; data: string } };
      const parts: Part[] = [{ text: fullPrompt }];

      if (imageBase64 && imageMimeType) {
        parts.push({ inlineData: { mimeType: imageMimeType, data: imageBase64 } });
      }

      const result = await model.generateContent(parts);
      const response = await result.response;
      const text = response.text();

      return {
        content: text || "I apologize, I could not generate a response.",
        finishReason: "stop",
        tokensUsed: undefined,
      };
    } catch (error: any) {
      console.error("Gemini API error:", error.message);
      throw new Error(`Gemini error: ${error.message}`);
    }
  }

  /**
   * Get system prompt for financial coach
   */
  private getSystemPrompt(userContext?: string): string {
    let prompt = `You are a compassionate financial behavioral coach specializing in spending psychology. Your role is to:

1. Analyze the EMOTIONAL and PSYCHOLOGICAL reasons behind spending
2. Use behavioral finance principles (loss aversion, present bias, mental accounting)
3. Provide actionable strategies to align spending with long-term goals
4. Be supportive and non-judgmental—money shame is counterproductive
5. Ask reflective questions to build self-awareness
6. Use financial icons (💰, 📈, 🧠, 🎯, etc.)
7. Focus on the "why" behind spending, not just the "what"

IMPORTANT SAFETY RULES:
- DO NOT provide specific investment recommendations (stocks, crypto, etc.)
- DO NOT give tax advice or legal counsel
- DO NOT diagnose financial trauma or mental health conditions
- DIRECT users to certified financial planners for complex investing
- DIRECT users to tax professionals for tax questions
- Provide general strategies for debt reduction and budgeting frameworks (50/30/20, etc.)

Mandatory Disclosures:
- If asked for investment advice: "I can help you understand general investing principles, but for specific recommendations, consult a certified financial advisor."
- If asked for tax advice: "Tax laws vary by location. Please consult a CPA or tax professional."`;

    if (userContext) prompt += `\n\nUSER PROFILE CONTEXT:\n${userContext}`;
    return prompt;
  }

  async stream(
    messages: AIMessage[],
    userContext: string | undefined,
    onChunk: (delta: string) => void
  ): Promise<void> {
    const model = this.client.getGenerativeModel({ model: this.config.model });
    const systemPrompt = this.getSystemPrompt(userContext);
    const conversationHistory = messages
      .map((msg) => `${msg.role === "assistant" ? "model" : "user"}: ${msg.content}`)
      .join("\n\n");
    const fullPrompt = `${systemPrompt}\n\n=== Conversation ===\n${conversationHistory}`;

    const result = await model.generateContentStream([{ text: fullPrompt }]);
    for await (const chunk of result.stream) {
      const delta = chunk.text();
      if (delta) onChunk(delta);
    }
  }

  getProviderName(): string { return "Google Gemini"; }
  isConfigured(): boolean { return !!this.config.apiKey && !!this.config.model; }
}

export default GeminiService;
