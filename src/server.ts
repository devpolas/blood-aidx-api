import http from "node:http";

import app from "./app";
import config from "./config";

import { db } from "./lib/db";
import { redisClient } from "./lib/redis";

import { initializeSocket } from "./socket/socket.server";

const bootstrap = async (): Promise<void> => {
  process.on("uncaughtException", (error: unknown) => {
    console.error("Uncaught Exception Error:", error);
    console.error("Uncaught Exception! Shutting down... 💥");

    process.exit(1);
  });

  process.on("unhandledRejection", (error: unknown) => {
    console.error("Unhandled Rejection Error:", error);
    console.error("Unhandled Rejection! Shutting down... 💥");

    process.exit(1);
  });

  try {
    // Database

    await db.connect();

    console.log("Database connected successfully");

    // Redis

    if (!redisClient.isReady) {
      await redisClient.connect();
    }

    console.log("Redis connected successfully");

    // HTTP + Socket.IO Server

    const server = http.createServer(app);

    initializeSocket(server);

    server.listen(config.port, () => {
      console.log(`HTTP + Socket.IO server is running on PORT ${config.port}`);
    });

    // Graceful Shutdown

    const shutdown = async (signal: string): Promise<void> => {
      console.log(`${signal} received. Shutting down...`);

      server.close(() => {
        console.log("HTTP + Socket.IO server closed");
      });

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
    };

    process.on("SIGTERM", () => {
      void shutdown("SIGTERM");
    });

    process.on("SIGINT", () => {
      void shutdown("SIGINT");
    });
  } catch (error) {
    console.error("Application failed to start... 💥", error);

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
