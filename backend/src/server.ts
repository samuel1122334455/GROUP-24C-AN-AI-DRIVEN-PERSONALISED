/**
 * Server Entry Point
 *
 * Starts the Express server and connects to MongoDB
 */

import { config } from "./config/environment";
import { connectDatabase } from "./config/database";
import { createApp } from "./app";
import { startCronJobs } from "./services/cron.service";

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Create Express app
    const app = createApp();

    // Start listening on all network interfaces
    const server = app.listen(config.port, "0.0.0.0", () => {
      // Extend socket timeout for long-running AI requests (receipt parsing, chat)
      server.setTimeout(120_000);
      console.log("");
      console.log("=".repeat(60));
      console.log("🚀 AI Finance Coach Backend Server");
      console.log("=".repeat(60));
      console.log(`📍 Server running on: http://localhost:${config.port}`);
      console.log(`📱 Network access: http://192.168.1.224:${config.port}`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);
      console.log(`🤖 AI Provider: ${config.ai.provider.toUpperCase()}`);
      console.log(`📅 Started at: ${new Date().toLocaleString()}`);
      console.log("=".repeat(60));
      console.log("");
      console.log("Available endpoints:");
      console.log(`  Health: http://localhost:${config.port}/health`);
      console.log(`  Auth:   http://localhost:${config.port}/api/auth`);
      console.log(`  User:   http://localhost:${config.port}/api/user`);
      console.log(`  Chat:   http://localhost:${config.port}/api/chat`);
      console.log(`  Transactions: http://localhost:${config.port}/api/transactions`);
      console.log("");
      console.log("Press Ctrl+C to stop the server");
      console.log("=".repeat(60));
      startCronJobs();
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);

      server.close(() => {
        console.log("✅ HTTP server closed");
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error("❌ Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();
