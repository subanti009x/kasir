"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "./auth";
import { getNotificationSocketConfig } from "./realtime";

/**
 * Hook that provides a shared WebSocket (Socket.IO) connection
 * to listen for real-time events from the backend.
 *
 * Usage:
 *   const socket = useNotifications();
 *   useEffect(() => {
 *     if (!socket) return;
 *     socket.on("whatsapp-qr", (data) => { ... });
 *     return () => { socket.off("whatsapp-qr"); };
 *   }, [socket]);
 */
export function useNotifications(): Socket | null {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user?.tenantId || !token) {
      setSocket(null);
      return;
    }

    const socketConfig = getNotificationSocketConfig();
    if (!socketConfig) {
      setSocket(null);
      return;
    }

    // Reuse existing connection if available
    if (socketRef.current?.connected) {
      setSocket(socketRef.current);
      return;
    }

    const newSocket: Socket = io(`${socketConfig.url}/notifications`, {
      path: socketConfig.path,
      transports: socketConfig.transports,
      auth: { token },
      reconnection: true,
    });

    newSocket.on("connect", () => {
      setSocket(newSocket);
    });
    newSocket.on("disconnect", () => {
      setSocket(null);
    });

    socketRef.current = newSocket;

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [user?.tenantId, token]);

  return socket;
}
