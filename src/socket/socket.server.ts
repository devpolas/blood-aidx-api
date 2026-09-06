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

export const initializeSocket = (httpServer: HttpServer): AppServer => {
  const io: AppServer = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
  >(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
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
