/**
 * Environment Configuration
 *
 * Centralized environment variable management with validation
 */

import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Validate required environment variables
 */
const required = [
  "PORT",
  "MONGODB_URI",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "AI_PROVIDER",
];

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(", ")}`
  );
}

/**
 * Validate AI provider and corresponding API key
 */
const aiProvider = process.env.AI_PROVIDER?.toLowerCase();

if (!["openai", "gemini"].includes(aiProvider || "")) {
  throw new Error('AI_PROVIDER must be either "openai" or "gemini"');
}

if (aiProvider === "openai" && !process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is required when AI_PROVIDER is "openai"');
}

if (aiProvider === "gemini" && !process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is required when AI_PROVIDER is "gemini"');
}

/**
 * Environment configuration object
 */
export const config = {
  // Server
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",

  // Database
  mongoUri: process.env.MONGODB_URI!,

  // JWT
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || "1d",
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || "30d",
  },

  // AI Provider
  ai: {
    provider: aiProvider as "openai" | "gemini",
    openai: {
      apiKey: process.env.OPENAI_API_KEY || "",
      model: process.env.OPENAI_MODEL || "gpt-4-turbo-preview",
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || "",
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    },
  },

  // CORS
  cors: {
    origins: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:19000"],
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),      // 1 minute window
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "300", 10),  // 300/min general (only in prod)
    authMaxRequests: parseInt(process.env.RATE_LIMIT_AUTH_MAX || "10", 10),   // 10/min on auth routes
  },
};

export default config;
