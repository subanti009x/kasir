type NotificationSocketConfig = {
  path: string;
  url: string;
};

export function getNotificationSocketConfig(): NotificationSocketConfig | null {
  const configuredUrl = process.env.NEXT_PUBLIC_NOTIFICATION_SOCKET_URL;
  if (configuredUrl) {
    return {
      path: "/socket.io",
      url: configuredUrl.replace(/\/$/, ""),
    };
  }

  if (typeof window === "undefined") {
    return {
      path: "/socket.io",
      url: "http://localhost:3000",
    };
  }

  const isVercelHosted = window.location.hostname.endsWith("vercel.app");
  const backendRoutePrefix = process.env.NEXT_PUBLIC_BACKEND_ROUTE_PREFIX || (isVercelHosted ? "/_/backend" : "");
  if (isVercelHosted && !process.env.NEXT_PUBLIC_NOTIFICATION_SOCKET_URL) {
    return null;
  }

  if (backendRoutePrefix) {
    return {
      path: `${backendRoutePrefix.replace(/\/$/, "")}/socket.io`,
      url: window.location.origin,
    };
  }

  const backendPort = process.env.NEXT_PUBLIC_BACKEND_PORT || "3000";
  return {
    path: "/socket.io",
    url: `${window.location.protocol}//${window.location.hostname}:${backendPort}`,
  };
}
