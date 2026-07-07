type NotificationSocketConfig = {
  path: string;
  transports: ("websocket" | "polling")[];
  url: string;
};

export function getNotificationSocketConfig(): NotificationSocketConfig | null {
  const configuredUrl = process.env.NEXT_PUBLIC_NOTIFICATION_SOCKET_URL;
  if (configuredUrl) {
    return {
      path: "/socket.io",
      transports: ["websocket"],
      url: configuredUrl.replace(/\/$/, ""),
    };
  }

  if (typeof window === "undefined") {
    return {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      url: "http://localhost:3000",
    };
  }

  const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  const backendRoutePrefix = process.env.NEXT_PUBLIC_BACKEND_ROUTE_PREFIX || (isLocalhost ? "" : "/_/backend");

  if (backendRoutePrefix) {
    return {
      path: `${backendRoutePrefix.replace(/\/$/, "")}/socket.io`,
      transports: ["websocket", "polling"],
      url: window.location.origin,
    };
  }

  const backendPort = process.env.NEXT_PUBLIC_BACKEND_PORT || "3000";
  return {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    url: `${window.location.protocol}//${window.location.hostname}:${backendPort}`,
  };
}
