"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { reportApi } from "@/lib/api";
import { Loader2, TrendingUp, CircleDollarSign, BarChart3, ShoppingCart } from "lucide-react";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

export default function ReportsPage() {
  const { token } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 8) + "01";
  const [startDate, setStartDate] = useState(monthStart);
  const [endDate, setEndDate] = useState(today);

  const { data: report, isLoading } = useQuery({
    queryKey: ["sales-report", startDate, endDate],
    queryFn: () => reportApi.sales(token!, startDate, endDate),
    enabled: !!token && !!startDate && !!endDate,
  });

  const summary = report?.summary || {};
  const daily = report?.dailyBreakdown || [];
  const bestSellers = report?.bestSellers || [];
  const payments = report?.paymentMethods || [];

  const maxDailySales = Math.max(...daily.map((d: any) => d.sales), 1);

  return (
    <div className="space-y-6">
      {/* Date filter */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center">
        <BarChart3 size={18} className="text-teal-700" />
        <span className="text-sm font-semibold text-slate-900">Laporan Penjualan</span>
        <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:items-center">
          <input type="date" className="h-11 rounded-lg border border-slate-200 px-3 text-sm sm:h-9" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <span className="text-xs text-slate-400">sampai</span>
          <input type="date" className="h-11 rounded-lg border border-slate-200 px-3 text-sm sm:h-9" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-2 inline-grid size-10 place-items-center rounded-lg bg-teal-50 text-teal-700"><CircleDollarSign size={20} /></div>
              <p className="text-sm text-slate-500">Total Pendapatan</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{formatCurrency(summary.totalRevenue || 0)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-2 inline-grid size-10 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><TrendingUp size={20} /></div>
              <p className="text-sm text-slate-500">Total Laba Bersih</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{formatCurrency(summary.totalProfit || 0)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-2 inline-grid size-10 place-items-center rounded-lg bg-sky-50 text-sky-700"><ShoppingCart size={20} /></div>
              <p className="text-sm text-slate-500">Jumlah Transaksi</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{summary.transactionCount || 0}</p>
              <p className="text-xs text-slate-400">Rerata {formatCurrency(summary.averageTransaction || 0)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Pajak Terkumpul</p>
              <p className="mt-1 text-xl font-bold text-slate-950">{formatCurrency(summary.totalTax || 0)}</p>
              <p className="text-xs text-slate-400">Total Diskon: {formatCurrency(summary.totalDiscount || 0)}</p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
            {/* Daily chart */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900">Penjualan Harian</h3>
              <div className="mt-4 flex items-end gap-1" style={{ height: 200 }}>
                {daily.length === 0 && <p className="m-auto text-sm text-slate-400">Tidak ada data untuk periode ini</p>}
                {daily.map((d: any) => {
                  const h = Math.max((d.sales / maxDailySales) * 180, 4);
                  return (
                    <div key={d.date} className="group flex flex-1 flex-col items-center gap-1">
                      <div className="relative w-full">
                        <div className="mx-auto w-full max-w-[32px] rounded-t-md bg-teal-600 transition-all group-hover:bg-teal-500" style={{ height: h }} />
                        <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-950 px-2 py-1 text-[10px] text-white opacity-0 shadow group-hover:opacity-100">
                          {formatCurrency(d.sales)}
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-400">{d.date.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              {/* Best sellers */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900">Produk Terlaris</h3>
                <div className="mt-3 space-y-2">
                  {bestSellers.length === 0 && <p className="py-4 text-center text-xs text-slate-400">Tidak ada data</p>}
                  {bestSellers.map((p: any, i: number) => (
                    <div key={p.productId} className="flex items-center gap-3 rounded-lg border border-slate-100 p-2.5">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">{p.name}</p>
                        <p className="text-[10px] text-slate-400">{p.quantity} terjual</p>
                      </div>
                      <span className="text-xs font-bold text-slate-900">{formatCurrency(p.revenue)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment method breakdown */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900">Metode Pembayaran</h3>
                <div className="mt-3 space-y-2">
                  {payments.map((p: any) => (
                    <div key={p.method} className="flex items-center justify-between rounded-lg border border-slate-100 p-2.5">
                      <div>
                        <p className="text-xs font-semibold">{p.method === "Cash" ? "Tunai" : p.method}</p>
                        <p className="text-[10px] text-slate-400">{p.count} transaksi</p>
                      </div>
                      <span className="text-xs font-bold">{formatCurrency(p.total)}</span>
                    </div>
                  ))}
                  {payments.length === 0 && <p className="py-4 text-center text-xs text-slate-400">Tidak ada data</p>}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
