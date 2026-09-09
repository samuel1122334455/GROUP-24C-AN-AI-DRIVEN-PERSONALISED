/**
 * Database Configuration and Connection
 *
 * MongoDB connection setup with Mongoose
 */

import mongoose from "mongoose";
import { config } from "./environment";

/**
 * Connect to MongoDB
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongoUri, {
      // Prefer IPv4 to avoid ::1 / 127.0.0.1 mismatch on Windows
      family: 4,
      // Short timeout to fail fast if no local MongoDB instance is listening
      serverSelectionTimeoutMS: 3_000,
      socketTimeoutMS: 60_000,
      heartbeatFrequencyMS: 10_000,
    });

    console.log("✅ MongoDB connected successfully");
    console.log(`📦 Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.warn("⚠️ Local MongoDB not detected. Starting In-Memory MongoDB fallback...");
    try {
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      const mongoServer = await MongoMemoryServer.create();
      const memoryUri = mongoServer.getUri();
      await mongoose.connect(memoryUri);
      console.log("✅ Connected to In-Memory MongoDB successfully");
      console.log(`📦 Database: ${mongoose.connection.name}`);
    } catch (memError) {
      console.error("❌ MongoDB connection error:", error);
      process.exit(1);
    }
  }
};

/**
 * Disconnect from MongoDB
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log("👋 MongoDB disconnected");
  } catch (error) {
    console.error("❌ MongoDB disconnection error:", error);
  }
};

/**
 * MongoDB connection event handlers
 */
mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err: Error) => {
  console.error("Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose disconnected from MongoDB");
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await disconnectDatabase();
  process.exit(0);
});

export default {
  connectDatabase,
  disconnectDatabase,
};
