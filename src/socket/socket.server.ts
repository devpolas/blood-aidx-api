import type { Server as HttpServer } from "node:http";

import { Server } from "socket.io";

import { socketAuth } from "./socket.auth";
import { registerSocketEvents } from "./socket.events";
import { setSocketServer } from "./socket.emitter";

import type {
  AppServer,
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from "./socket.types";

const allowedOrigins = new Set(
  (process.env.ORIGIN_URLS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

export const initializeSocket = (httpServer: HttpServer): AppServer => {
  const io: AppServer = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
  >(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow non-browser clients
        if (!origin) {
          callback(null, true);
          return;
        }

        // Allow configured origins
        if (allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }

        callback(
          new Error(`Origin ${origin} not allowed by Socket.IO CORS`),
          false,
        );
      },

      credentials: true,

      methods: ["GET", "POST"],
    },
  });

  // Register Socket.IO instance
  setSocketServer(io);

  // Authentication
  io.use(socketAuth);

  // Connection
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id} | user=${socket.data.user.id}`);

    registerSocketEvents(io, socket);
  });

  return io;
};
