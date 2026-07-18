"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "@/lib/auth";
import { getNotificationSocketConfig } from "@/lib/realtime";
import {
  LayoutDashboard, ShoppingCart, Tags, Boxes, PackageSearch, Users, Truck, BarChart3,
  Settings, LogOut, Menu, X, Shield, Bell, User as UserIcon, CheckCheck, Trash2,
  FileBox, Calculator, Sparkles,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/pos", label: "Kasir (POS)", icon: ShoppingCart },
  { href: "/dashboard/products", label: "Produk", icon: Tags },
  { href: "/dashboard/categories", label: "Kategori", icon: PackageSearch },
  { href: "/dashboard/inventory", label: "Inventaris", icon: Boxes },
  { href: "/dashboard/transactions", label: "Transaksi", icon: FileBox },
  { href: "/dashboard/customers", label: "Pelanggan", icon: Users },
  { href: "/dashboard/suppliers", label: "Pemasok", icon: Truck },
  { href: "/dashboard/reports", label: "Laporan", icon: BarChart3 },
  { href: "/dashboard/accounting", label: "Akuntansi", icon: Calculator },
  { href: "/dashboard/employees", label: "Karyawan", icon: UserIcon },
  { href: "/dashboard/settings", label: "Pengaturan", icon: Settings },
];

type AppNotification = {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  read: boolean;
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, loading, logout, canManage, isSuperAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketError, setSocketError] = useState("");
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;

    const storageKey = `pos_notifications_${user.id}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setNotifications(JSON.parse(stored));
      } catch {
        localStorage.removeItem(storageKey);
      }
    }
  }, [user]);

  useEffect(() => {
    if (!user || !token) return;

    localStorage.setItem(`pos_notifications_${user.id}`, JSON.stringify(notifications.slice(0, 50)));
  }, [notifications, user, token]);

  useEffect(() => {
    if (!user?.tenantId || !token) {
      setSocketConnected(false);
      setSocketError("");
      return;
    }

    const socketConfig = getNotificationSocketConfig();
    if (!socketConfig) {
      setSocketConnected(false);
      setSocketError("Pembaruan langsung belum dikonfigurasi");
      return;
    }

    const socket: Socket = io(`${socketConfig.url}/notifications`, {
      path: socketConfig.path,
      transports: socketConfig.transports,
      auth: { token },
      reconnection: true,
    });

    const addNotification = (eventType: string, payload: any) => {
      setNotifications((current) => [
        {
          id: `${eventType}-${payload?.timestamp || Date.now()}-${Math.random().toString(36).slice(2)}`,
          type: payload?.type || eventType,
          message: payload?.message || "Notifikasi baru",
          timestamp: payload?.timestamp || new Date().toISOString(),
          read: false,
        },
        ...current,
      ].slice(0, 50));
    };

    socket.on("connect", () => {
      setSocketConnected(true);
      setSocketError("");
    });
    socket.on("disconnect", () => setSocketConnected(false));
    socket.on("connect_error", (error) => {
      setSocketConnected(false);
      setSocketError(error.message || "Tidak dapat terhubung ke pembaruan langsung");
    });
    socket.on("notification-ready", (payload) => addNotification("notification-ready", payload));
    socket.on("low-stock", (payload) => addNotification("low-stock", payload));
    socket.on("transaction", (payload) => addNotification("transaction", payload));
    socket.on("payment", (payload) => addNotification("payment", payload));
    socket.on("transaction-refunded", (payload) => addNotification("transaction-refunded", payload));

    return () => {
      socket.disconnect();
    };
  }, [user?.tenantId, token]);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-teal-600" />
          Memuat...
        </div>
      </div>
    );
  }

  const visibleItems = navItems.filter((item) => {
    if (item.href === "/dashboard/employees" && !canManage) return false;
    if (item.href === "/dashboard/suppliers" && !canManage) return false;
    if (item.href === "/dashboard/settings" && !canManage) return false;
    if (item.href === "/dashboard/reports" && !canManage) return false;
    if (item.href === "/dashboard/accounting" && !canManage) return false;
    return true;
  });
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  function markAllRead() {
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
  }

  function clearNotifications() {
    setNotifications([]);
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,calc(100vw-2rem))] flex-col border-r border-slate-200 bg-white shadow-xl shadow-slate-900/5 transition-transform lg:static lg:w-72 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center overflow-hidden rounded-lg bg-white border border-slate-200 p-0.5 shadow-sm">
              <img src="/logo.jpg" alt="RSI Logo" className="h-full w-full object-contain rounded-md" />
            </div>
            <div>
              <p className="line-clamp-2 text-sm font-bold text-slate-950">Admin Solutions Inovatif</p>
              <p className="text-sm text-slate-500">Sistem Manajemen Bisnis & POS</p>
            </div>
          </div>
          <button
            className="grid size-10 place-items-center rounded-lg border border-slate-200 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={16} />
          </button>
        </div>

        {/* User info */}
        <div className="border-b border-slate-100 px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-teal-700 text-xs font-bold text-white">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
              <p className="truncate text-xs text-slate-500">{user.role.replace("_", " ")}</p>
            </div>
          </div>
        </div>

        {/* Tenant guard */}
        {!isSuperAdmin && user.tenant && (
          <div className="mx-4 mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
              <Shield size={14} />
              Tenant terisolasi
            </div>
            <p className="mt-1 text-[11px] text-emerald-700">
              Data terbatas pada <span className="font-semibold">{user.tenant.name}</span>
            </p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {isSuperAdmin && (
              <>
                <Link
                  href="/dashboard/admin"
                  className={`flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${
                    pathname === "/dashboard/admin"
                      ? "bg-slate-950 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Shield size={18} />
                  Platform Admin
                </Link>
                <Link
                  href="/dashboard/exclusive-features"
                  className={`flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${
                    pathname === "/dashboard/exclusive-features" || pathname.startsWith("/dashboard/exclusive-features/")
                      ? "bg-slate-950 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Sparkles size={18} />
                  Fitur Eksklusif
                </Link>
              </>
            )}
            {visibleItems.map((item) => {
              const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
              const isExactDashboard = item.href === "/dashboard" && pathname === "/dashboard";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${
                    active || isExactDashboard
                      ? "bg-slate-950 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout */}
        <div className="border-t border-slate-100 px-3 py-3">
          <button
            className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-700"
            onClick={() => { logout(); router.replace("/"); }}
          >
            <LogOut size={18} />
            Keluar
          </button>
          <div className="mt-2 text-center text-[10px] text-slate-400">
            Didukung oleh RSI (Ray Solutions Inovatif)
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-3 backdrop-blur sm:gap-4 sm:px-4 lg:px-6">
          <button
            className="grid size-10 place-items-center rounded-lg border border-slate-200 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-bold text-slate-950 sm:text-lg">
              {navItems.find((i) => pathname === i.href || (i.href !== "/dashboard" && pathname.startsWith(i.href)))?.label ||
                (pathname.includes("/admin") ? "Platform Admin" : pathname.includes("/exclusive-features") ? "Fitur Eksklusif" : "Dashboard")}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                className="relative grid size-10 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                onClick={() => setNotificationsOpen((open) => !open)}
                aria-label="Open notifications"
                aria-expanded={notificationsOpen}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="fixed left-3 right-3 top-16 z-50 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-900/10 sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-[min(22rem,calc(100vw-2rem))]">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-slate-950">Notifikasi</p>
                      <p className={`text-xs ${socketConnected ? "text-emerald-600" : "text-amber-600"}`}>
                        {user.tenantId ? (socketConnected ? "Terhubung secara langsung" : socketError || "Menghubungkan...") : "Akun platform"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="grid size-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100" onClick={markAllRead} title="Tandai semua sudah dibaca">
                        <CheckCheck size={15} />
                      </button>
                      <button className="grid size-8 place-items-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600" onClick={clearNotifications} title="Hapus notifikasi">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-10 text-center">
                        <div className="mx-auto grid size-10 place-items-center rounded-lg bg-slate-100 text-slate-400">
                          <Bell size={18} />
                        </div>
                        <p className="mt-3 text-sm font-semibold text-slate-700">Belum ada notifikasi</p>
                        <p className="mt-1 text-xs text-slate-500">Penjualan, pembayaran, refund, dan peringatan stok akan muncul di sini.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {notifications.map((notification) => (
                          <button
                            key={notification.id}
                            className="flex w-full gap-3 px-4 py-3 text-left hover:bg-slate-50"
                            onClick={() => {
                              setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read: true } : item));
                            }}
                          >
                            <span className={`mt-1 size-2 shrink-0 rounded-full ${notification.read ? "bg-slate-200" : "bg-teal-600"}`} />
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold text-slate-900">{notification.message}</span>
                              <span className="mt-1 block text-xs text-slate-500">
                                {new Date(notification.timestamp).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="mobile-safe-area flex-1 p-3 sm:p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
