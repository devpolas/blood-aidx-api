import type { Server, Socket } from "socket.io";

export interface SocketUser {
  id: string;
  role: string;
}

export interface SocketData {
  user: SocketUser;
}

export interface ClientToServerEvents {
  "conversation:join": (
    data: {
      conversationId: string;
    },
    callback?: SocketCallback,
  ) => void;

  "conversation:leave": (
    data: {
      conversationId: string;
    },
    callback?: SocketCallback,
  ) => void;

  "message:send": (
    data: {
      conversationId: string;
      content: string;
    },
    callback?: SocketCallback,
  ) => void;

  "message:update": (
    data: {
      messageId: string;
      content: string;
    },
    callback?: SocketCallback,
  ) => void;

  "message:delete": (
    data: {
      messageId: string;
    },
    callback?: SocketCallback,
  ) => void;

  "conversation:read": (
    data: {
      conversationId: string;
    },
    callback?: SocketCallback,
  ) => void;

  "typing:start": (data: { conversationId: string }) => void;

  "typing:stop": (data: { conversationId: string }) => void;
}

export interface ServerToClientEvents {
  "message:new": (message: unknown) => void;

  "message:updated": (message: unknown) => void;

  "message:deleted": (data: {
    conversationId: string;
    messageId: string;
  }) => void;

  "conversation:read": (data: {
    conversationId: string;
    userId: string;
    lastReadAt: string;
  }) => void;

  "typing:start": (data: { conversationId: string; userId: string }) => void;

  "typing:stop": (data: { conversationId: string; userId: string }) => void;

  "socket:error": (data: { message: string }) => void;
}

export interface SocketCallback {
  (response: {
    success: boolean;
    message?: string;
    data?: unknown;
    error?: string;
  }): void;
}

export type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

export type AppServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;
