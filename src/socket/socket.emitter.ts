import type { AppServer } from "./socket.types";
import { SOCKET_ROOM } from "./socket.rooms";

let io: AppServer | null = null;

export const setSocketServer = (socketServer: AppServer): void => {
  io = socketServer;
};

export const emitNotification = (
  userId: string,
  notification: unknown,
): void => {
  if (!io) {
    console.warn("Socket.IO server is not initialized");
    return;
  }

  io.to(SOCKET_ROOM.user(userId)).emit("notification:new", notification);
};
