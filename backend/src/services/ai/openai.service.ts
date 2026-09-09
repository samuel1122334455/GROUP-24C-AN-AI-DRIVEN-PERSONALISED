/**
 * OpenAI Service Implementation
 */

import OpenAI from "openai";
import { IAIProvider, AIMessage, AIResponse, AIConfig } from "./provider.interface";

export class OpenAIService implements IAIProvider {
  private client: OpenAI;
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
    this.client = new OpenAI({ apiKey: config.apiKey });
  }

  async chat(
    messages: AIMessage[],
    userContext?: string,
    imageBase64?: string,
    imageMimeType?: string
  ): Promise<AIResponse> {
    try {
      // Add system message with financial coach context
      const systemMessage = { role: "system" as const, content: this.getSystemPrompt(userContext) };

      const formattedMessages = messages.map((msg, index) => {
        const isLastUserMessage = index === messages.length - 1 && msg.role === "user";
        if (isLastUserMessage && imageBase64 && imageMimeType) {
          return {
            role: "user" as const,
            content: [
              { type: "text" as const, text: msg.content },
              {
                type: "image_url" as const,
                image_url: { url: `data:${imageMimeType};base64,${imageBase64}` },
              },
            ],
          };
        }
        return { role: msg.role as "user" | "assistant", content: msg.content };
      });

      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [systemMessage, ...formattedMessages] as any,
        temperature: this.config.temperature || 0.7,
        max_tokens: this.config.maxTokens || 1000,
      });

      const completion = response.choices[0];
      return {
        content: completion.message.content || "I apologize, I could not generate a response.",
        finishReason: completion.finish_reason,
        tokensUsed: response.usage?.total_tokens,
      };
    } catch (error: any) {
      console.error("OpenAI API error:", error.message);
      throw new Error(`OpenAI error: ${error.message}`);
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
    const systemMessage = { role: "system" as const, content: this.getSystemPrompt(userContext) };
    const formattedMessages = messages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    const stream = await this.client.chat.completions.create({
      model: this.config.model,
      messages: [systemMessage, ...formattedMessages] as any,
      temperature: this.config.temperature || 0.7,
      max_tokens: this.config.maxTokens || 1000,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || "";
      if (delta) onChunk(delta);
    }
  }

  getProviderName(): string { return "OpenAI"; }
  isConfigured(): boolean { return !!this.config.apiKey && !!this.config.model; }
}

export default OpenAIService;
