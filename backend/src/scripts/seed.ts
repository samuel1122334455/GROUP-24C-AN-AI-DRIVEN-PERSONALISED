/**
 * Database Seed Script
 *
 * Seeds the database with a test user
 */

import mongoose from "mongoose";
import { User } from "../models/User.model";
import { hashPassword } from "../utils/password.util";
import { config } from "../config/environment";

const seedUser = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log("✓ Connected to MongoDB");

    const existingUser = await User.findOne({ email: "test@example.com" });
    if (existingUser) {
      console.log("✓ Test user already exists");
      await mongoose.connection.close();
      return;
    }

    const hashedPassword = await hashPassword("password123");

    await User.create({
      email: "test@example.com",
      password: hashedPassword,
      name: "Test User",
      profile: {
        age: 30,
        monthlyIncome: 4000,
        primaryGoal: "budget_control",
        riskTolerance: "moderate",
        spendingCategories: [],
      },
    });

    console.log("✓ Test user created successfully");
    console.log("\n📧 Email: test@example.com");
    console.log("🔑 Password: password123\n");

    await mongoose.connection.close();
    console.log("✓ Database connection closed");
  } catch (error) {
    console.error("✗ Error seeding database:", error);
    process.exit(1);
  }
};

seedUser();
