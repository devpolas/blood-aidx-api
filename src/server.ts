import app from "./app";

import { redisClient } from "./lib/redis";
import config from "./config";
import { db } from "./prisma/db";

const bootstrap = async (): Promise<void> => {
  // Handle uncaught exceptions
  process.on("uncaughtException", (error: unknown) => {
    console.error("Uncaught Exception Error:", error);
    console.error("Uncaught Exception! Shutting down... 💥");

    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (error: unknown) => {
    console.error("Unhandled Rejection Error:", error);
    console.error("Unhandled Rejection! Shutting down... 💥");

    process.exit(1);
  });

  try {
    // Connect database
    await db.connect();

    console.log("Database connected successfully");

    // Connect Redis
    if (!redisClient.isReady) {
      await redisClient.connect();
    }

    console.log("Redis connected successfully");

    // Start HTTP server only after dependencies are ready
    const server = app.listen(config.port, () => {
      console.log(`Server is running on PORT ${config.port}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      console.log(`${signal} received. Shutting down...`);

      server.close(async () => {
        try {
          if (redisClient.isOpen) {
            await redisClient.quit();
          }

          await db.close();

          console.log("Redis and database disconnected successfully");

          process.exit(0);
        } catch (error) {
          console.error("Error during shutdown:", error);

          process.exit(1);
        }
      });
    };

    process.on("SIGTERM", () => {
      void shutdown("SIGTERM");
    });

    process.on("SIGINT", () => {
      void shutdown("SIGINT");
    });
  } catch (error) {
    console.error("Application failed to start... 💥", error);

    // Close dependencies if partially initialized
    try {
      if (redisClient.isOpen) {
        await redisClient.quit();
      }

      await db.close();
    } catch (shutdownError) {
      console.error("Error while cleaning up startup failure:", shutdownError);
    }

    process.exit(1);
  }
};

void bootstrap();
