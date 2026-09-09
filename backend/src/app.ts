/**
 * Express Application Setup
 *
 * Configures middleware, routes, and error handling
 */

import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { config } from "./config/environment";
import { errorHandler, notFound } from "./middleware/error.middleware";

// Import routes
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import chatRoutes from "./routes/chat.routes";
import transactionRoutes from "./routes/transaction.routes";
import notificationRoutes from "./routes/notification.routes";

/**
 * Create Express application
 */
export const createApp = (): Application => {
  const app = express();

  // Trust the first proxy (nginx) so rate-limiter and IP detection work correctly
  app.set("trust proxy", 1);

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: config.cors.origins,
      credentials: true,
    })
  );

  // Request logging (only in development)
  if (config.isDevelopment) {
    app.use(morgan("dev"));
  }

  // Body parsing middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  if (config.isProduction) {
    // General rate limit — only enforced in production
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.maxRequests,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        console.warn(
          `[RateLimit] 429 ${req.method} ${req.path} | IP: ${req.ip} | window: ${config.rateLimit.windowMs / 60000}min`
        );
        res.status(429).json({ success: false, message: "Too many requests, please try again later." });
      },
    });
    app.use("/api", limiter);
  } else {
    // Development: log rapid-fire calls to aid debugging but never block them
    app.use("/api", (req: Request, _res: Response, next: NextFunction) => {
      console.log(`[API] ${req.method} ${req.path}`);
      next();
    });
  }

  // Brute-force guard on auth routes — always active regardless of environment
  const authLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.authMaxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      console.warn(`[RateLimit/Auth] 429 ${req.method} ${req.path} | IP: ${req.ip}`);
      res.status(429).json({ success: false, message: "Too many auth attempts, please try again later." });
    },
  });
  app.use("/api/auth", authLimiter);

  // Root + health check endpoints
  app.get("/", (req, res) => {
    res.status(200).json({
      name: "AI Finance Coach API",
      status: "ok",
      version: "1.0.0",
      docs: "/health",
    });
  });

  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      aiProvider: config.ai.provider,
    });
  });

  // API routes
  app.use("/api/auth", authRoutes);
  app.use("/api/user", userRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/api/transactions", transactionRoutes);
  app.use("/api/notifications", notificationRoutes);

  // 404 handler
  app.use(notFound);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
};

export default createApp;
