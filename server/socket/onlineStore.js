// Shared map of currently connected users — imported by both socket handlers and API routes
export const onlineUsers = new Map(); // userId (string) -> socketId
