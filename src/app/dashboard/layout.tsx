"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, ShoppingCart, Tags, Boxes, PackageSearch, Users, Truck, BarChart3,
  Settings, Store, ChevronDown, LogOut, Menu, X, Shield, Bell, User as UserIcon,
  FileBox,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/pos", label: "Point of Sale", icon: ShoppingCart },
  { href: "/dashboard/products", label: "Products", icon: Tags },
  { href: "/dashboard/categories", label: "Categories", icon: PackageSearch },
  { href: "/dashboard/inventory", label: "Inventory", icon: Boxes },
  { href: "/dashboard/transactions", label: "Transactions", icon: FileBox },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/suppliers", label: "Suppliers", icon: Truck },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
  { href: "/dashboard/employees", label: "Employees", icon: UserIcon },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout, canManage, isSuperAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-teal-600" />
          Loading...
        </div>
      </div>
    );
  }

  const visibleItems = navItems.filter((item) => {
    if (item.href === "/dashboard/employees" && !canManage) return false;
    if (item.href === "/dashboard/suppliers" && !canManage) return false;
    if (item.href === "/dashboard/settings" && !canManage) return false;
    if (item.href === "/dashboard/reports" && !canManage) return false;
    return true;
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white shadow-xl shadow-slate-900/5 transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-lg bg-slate-950 text-sm font-bold text-white">
              POS
            </div>
            <div>
              <p className="text-sm font-bold text-slate-950">KasirPro Cloud</p>
              <p className="text-xs text-slate-500">Multi-tenant SaaS</p>
            </div>
          </div>
          <button
            className="grid size-8 place-items-center rounded-lg border border-slate-200 lg:hidden"
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
              Tenant isolated
            </div>
            <p className="mt-1 text-[11px] text-emerald-700">
              Data scoped to <span className="font-semibold">{user.tenant.name}</span>
            </p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {isSuperAdmin && (
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
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:px-6">
          <button
            className="grid size-10 place-items-center rounded-lg border border-slate-200 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={18} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-slate-950">
              {navItems.find((i) => pathname === i.href || (i.href !== "/dashboard" && pathname.startsWith(i.href)))?.label ||
                (pathname.includes("/admin") ? "Platform Admin" : "Dashboard")}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative grid size-10 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
              <Bell size={18} />
              <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                3
              </span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
