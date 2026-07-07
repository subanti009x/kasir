"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { reportApi, inventoryApi } from "@/lib/api";
import {
  CircleDollarSign, CalendarDays, Package, Users, AlertTriangle,
  TrendingUp, Loader2,
} from "lucide-react";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

function StatCard({ icon: Icon, label, value, tone, sub }: { icon: any; label: string; value: string; tone: string; sub?: string }) {
  const colors: Record<string, string> = {
    teal: "bg-teal-50 text-teal-700",
    sky: "bg-sky-50 text-sky-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    emerald: "bg-emerald-50 text-emerald-700",
    violet: "bg-violet-50 text-violet-700",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className={`mb-4 inline-grid size-11 place-items-center rounded-xl ${colors[tone] || colors.teal}`}>
        <Icon size={22} />
      </div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { token } = useAuth();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => reportApi.dashboard(token!),
    enabled: !!token,
  });

  const { data: lowStock } = useQuery({
    queryKey: ["low-stock"],
    queryFn: () => inventoryApi.lowStock(token!),
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  const d = dashboard || {};

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CircleDollarSign} label="Penjualan Hari Ini" value={formatCurrency(d.todaySales || 0)} tone="teal" sub={`${d.todayTransactions || 0} transaksi`} />
        <StatCard icon={CalendarDays} label="Penjualan Bulan Ini" value={formatCurrency(d.monthlySales || 0)} tone="sky" sub={`${d.monthlyTransactions || 0} transaksi`} />
        <StatCard icon={Package} label="Total Produk" value={String(d.totalProducts || 0)} tone="violet" />
        <StatCard icon={AlertTriangle} label="Stok Menipis" value={String(d.lowStockCount || 0)} tone="rose" sub="Perlu segera diisi ulang" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        {/* Recent Transactions */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950">Transaksi Terbaru</h2>
            <span className="text-xs text-slate-400">10 terakhir</span>
          </div>
          <div className="mt-4 space-y-2">
            {(d.recentTransactions || []).length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400">Belum ada transaksi</p>
            )}
            {(d.recentTransactions || []).map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3 transition hover:bg-slate-50">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{tx.receiptId}</p>
                  <p className="text-xs text-slate-500">
                    {tx.cashier?.name || "—"} · {tx.paymentMethod} · {new Date(tx.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-950">{formatCurrency(tx.total)}</p>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    tx.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  }`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-rose-500" size={18} />
            <h2 className="text-lg font-bold text-slate-950">Peringatan Stok Menipis</h2>
          </div>
          <div className="mt-4 space-y-3">
            {(lowStock || []).length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400">Semua produk masih tersedia cukup</p>
            )}
            {(lowStock || []).map((p: any) => {
              const ratio = Math.min((p.stock / Math.max(p.minStock, 1)) * 100, 100);
              return (
                <div key={p.id} className="rounded-lg border border-slate-100 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.sku} · Min: {p.minStock}</p>
                    </div>
                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700">
                      {p.stock} tersisa
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                    <div className="h-1.5 rounded-full bg-rose-500 transition-all" style={{ width: `${ratio}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={Users} label="Total Pelanggan" value={String(d.totalCustomers || 0)} tone="emerald" />
        <StatCard icon={Users} label="Total Karyawan" value={String(d.totalEmployees || 0)} tone="sky" />
        <StatCard icon={TrendingUp} label="Rata-rata Transaksi" value={formatCurrency(d.todayTransactions > 0 ? (d.todaySales || 0) / d.todayTransactions : 0)} tone="amber" />
      </div>
    </div>
  );
}
