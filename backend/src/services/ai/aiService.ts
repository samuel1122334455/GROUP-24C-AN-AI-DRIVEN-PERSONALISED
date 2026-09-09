/**
 * AI Service - Provider Abstraction Layer
 *
 * This is the SINGLE entry point for all AI operations.
 * Automatically routes to the correct provider based on environment config.
 *
 * CRITICAL: No code changes needed to switch providers - just update .env
 */

import { config } from "../../config/environment";
import { IAIProvider, AIMessage, AIResponse } from "./provider.interface";
import { OpenAIService } from "./openai.service";
import { GeminiService } from "./gemini.service";

class AIService {
  private provider: IAIProvider;

  constructor() {
    // Initialize provider based on environment configuration
    this.provider = this.initializeProvider();

    console.log(
      `🤖 AI Provider initialized: ${this.provider.getProviderName()}`
    );

    if (!this.provider.isConfigured()) {
      console.warn(
        "⚠️  AI Provider is not properly configured. Check your environment variables."
      );
    }
  }

  /**
   * Initialize the correct AI provider based on config
   */
  private initializeProvider(): IAIProvider {
    const providerType = config.ai.provider;

    switch (providerType) {
      case "openai":
        return new OpenAIService({
          apiKey: config.ai.openai.apiKey,
          model: config.ai.openai.model,
          temperature: 0.7,
          maxTokens: 1000,
        });

      case "gemini":
        return new GeminiService({
          apiKey: config.ai.gemini.apiKey,
          model: config.ai.gemini.model,
          temperature: 0.7,
        });

      default:
        throw new Error(`Unsupported AI provider: ${providerType}`);
    }
  }

  /**
   * Send a chat message to the AI
   *
   * @param messages - Conversation history
   * @param userContext - Optional user profile context
   * @returns AI response
   */
  async chat(
    messages: AIMessage[],
    userContext?: string,
    imageBase64?: string,
    imageMimeType?: string
  ): Promise<AIResponse> {
    try {
      if (!this.provider.isConfigured()) {
        throw new Error("AI provider is not properly configured");
      }

      const response = await this.provider.chat(messages, userContext, imageBase64, imageMimeType);
      return response;
    } catch (error: any) {
      console.error("AI Service error:", error.message);

      // Return fallback response
      return {
        content: `I apologize, but I'm having trouble processing your request right now. This could be due to:

🔧 Technical issues with the AI service
🔑 Configuration problems
📡 Network connectivity

Please try again in a moment. If the problem persists, contact support.`,
        finishReason: "error",
      };
    }
  }

  /**
   * Stream a chat response chunk-by-chunk via the provider's streaming API.
   */
  async stream(
    messages: AIMessage[],
    userContext: string | undefined,
    onChunk: (delta: string) => void
  ): Promise<void> {
    if (!this.provider.isConfigured()) {
      throw new Error("AI provider is not properly configured");
    }
    await this.provider.stream(messages, userContext, onChunk);
  }

  /**
   * Generate text from a single prompt
   */
  async generateText(prompt: string): Promise<string> {
    const response = await this.chat([{ role: "user", content: prompt }]);
    return response.content;
  }

  /**
   * Get current provider name
   */
  getProviderName(): string {
    return this.provider.getProviderName();
  }

  /**
   * Format user profile + current-month spending as context for AI.
   * The AI uses this to answer direct questions about profile, budget, and spending.
   */
  formatUserContext(
    user: any,
    spendingSummary?: { totalSpent: number; byCategory: Record<string, number>; month: string }
  ): string {
    if (!user || !user.profile) return "";

    const { profile, userPrefs } = user;
    const currency = userPrefs?.currency || "USD";
    const spendingBudget = profile.monthlyIncome - profile.monthlySavingsTarget;

    const goalLabels: Record<string, string> = {
      save_emergency: "Build Emergency Fund",
      pay_debt: "Pay Off Debt",
      invest: "Start Investing",
      budget_control: "Control Budget",
    };

    let ctx = `=== USER PROFILE ===
Name: ${user.name}
Age: ${profile.age}
Monthly Income: ${currency} ${profile.monthlyIncome.toLocaleString()}
Monthly Savings Target: ${currency} ${profile.monthlySavingsTarget.toLocaleString()}
Monthly Spending Budget: ${currency} ${spendingBudget.toLocaleString()} (income minus savings target)
Risk Tolerance: ${profile.riskTolerance}
Primary Financial Goal: ${goalLabels[profile.primaryGoal] || profile.primaryGoal}
Tracked Spending Categories: ${profile.spendingCategories.join(", ") || "None set"}
Preferred Currency: ${currency}
Notifications — Spending Alerts: ${userPrefs?.spendingAlerts ? "On" : "Off"}, Weekly Report: ${userPrefs?.weeklyReport ? "On" : "Off"}, Check-In: ${userPrefs?.checkIn ? "On" : "Off"}`;

    if (spendingSummary) {
      const remaining = spendingBudget - spendingSummary.totalSpent;
      const categoryLines = Object.entries(spendingSummary.byCategory)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, amt]) => `  • ${cat}: ${currency} ${amt.toFixed(2)}`)
        .join("\n");

      ctx += `\n\n=== CURRENT MONTH SPENDING (${spendingSummary.month}) ===
Total Spent: ${currency} ${spendingSummary.totalSpent.toFixed(2)}
Budget Remaining: ${currency} ${remaining.toFixed(2)}
Spent by Category:
${categoryLines || "  No transactions recorded yet"}`;
    }

    ctx += `\n\nIMPORTANT: When the user asks about their profile, income, savings target, spending budget, spending limits, current spending, categories, currency, or preferences — answer DIRECTLY using the data above. You have their live data; never ask them to check the app.`;

    return ctx;
  }
}

// Export singleton instance
export const aiService = new AIService();

export default aiService;
