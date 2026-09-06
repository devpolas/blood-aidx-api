export const SOCKET_ROOM = {
  conversation: (conversationId: string) => `conversation:${conversationId}`,
  user: (userId: string) => `user:${userId}`,
};
