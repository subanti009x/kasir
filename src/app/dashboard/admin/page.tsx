"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { tenantApi } from "@/lib/api";
import { Loader2, Building2, Users, ShoppingCart, CircleDollarSign, ToggleLeft, ToggleRight, BadgeDollarSign } from "lucide-react";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

export default function AdminPage() {
  const { token, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({ queryKey: ["admin-stats"], queryFn: () => tenantApi.stats(token!), enabled: !!token && isSuperAdmin });
  const { data: tenantsData, isLoading } = useQuery({ queryKey: ["admin-tenants"], queryFn: () => tenantApi.list(token!), enabled: !!token && isSuperAdmin });
  const { data: plans = [] } = useQuery({ queryKey: ["admin-plans"], queryFn: () => tenantApi.plans(token!), enabled: !!token && isSuperAdmin });

  const toggleMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => tenantApi.update(token!, id, { status }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-tenants"] }); queryClient.invalidateQueries({ queryKey: ["admin-stats"] }); },
  });
  const planMut = useMutation({
    mutationFn: ({ id, plan }: { id: string; plan: string }) => tenantApi.update(token!, id, { plan }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-tenants"] }); queryClient.invalidateQueries({ queryKey: ["admin-stats"] }); },
  });

  if (!isSuperAdmin) return <p className="py-20 text-center text-slate-500">Akses ditolak. Halaman ini hanya untuk Super Admin.</p>;

  const tenants = tenantsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Platform stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 inline-grid size-10 place-items-center rounded-lg bg-violet-50 text-violet-700"><Building2 size={20} /></div>
          <p className="text-sm text-slate-500">Total Toko (Tenant)</p>
          <p className="text-2xl font-bold text-slate-950">{stats?.totalTenants || 0}</p>
          <p className="text-xs text-slate-400">{stats?.activeTenants || 0} aktif</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 inline-grid size-10 place-items-center rounded-lg bg-sky-50 text-sky-700"><Users size={20} /></div>
          <p className="text-sm text-slate-500">Total Pengguna</p>
          <p className="text-2xl font-bold text-slate-950">{stats?.totalUsers || 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 inline-grid size-10 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><ShoppingCart size={20} /></div>
          <p className="text-sm text-slate-500">Total Transaksi</p>
          <p className="text-2xl font-bold text-slate-950">{stats?.totalTransactions || 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 inline-grid size-10 place-items-center rounded-lg bg-teal-50 text-teal-700"><CircleDollarSign size={20} /></div>
          <p className="text-sm text-slate-500">GMV Platform</p>
          <p className="text-2xl font-bold text-slate-950">{formatCurrency(stats?.totalRevenue || 0)}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan: any) => (
          <div key={plan.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="inline-grid size-10 place-items-center rounded-lg bg-amber-50 text-amber-700"><BadgeDollarSign size={20} /></div>
              <span className="text-sm font-bold text-slate-950">{formatCurrency(plan.monthlyPrice)}/bulan</span>
            </div>
            <h3 className="text-sm font-bold text-slate-950">{plan.name}</h3>
            <p className="mt-1 text-xs text-slate-500">
              {plan.limits.products ? `${plan.limits.products} produk` : "Produk tanpa batas"} / {plan.limits.employees ? `${plan.limits.employees} karyawan` : "Karyawan tanpa batas"}
            </p>
            <div className="mt-3 flex flex-wrap gap-1">
              {plan.features.slice(0, 3).map((feature: string) => <span key={feature} className="rounded bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">{feature}</span>)}
            </div>
          </div>
        ))}
      </div>

      {/* Tenants table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-950">Daftar Toko UMKM</h2>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="responsive-table w-full text-sm">
              <thead><tr className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
                <th className="px-5 py-3">Toko / Tenant</th><th className="px-5 py-3">Paket</th><th className="px-5 py-3 text-center">Pengguna</th><th className="px-5 py-3 text-center">Produk</th><th className="px-5 py-3 text-center">Transaksi</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-center">Aksi</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {tenants.map((t: any) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-semibold text-slate-900">{t.name}</p>
                        <p className="text-xs text-slate-500">{t.slug} · {t.email || "—"}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold text-slate-700"
                        value={t.plan}
                        onChange={(event) => planMut.mutate({ id: t.id, plan: event.target.value })}
                      >
                        {plans.map((plan: any) => <option key={plan.id} value={plan.id}>{plan.id}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-4 text-center">{t._count?.users || 0}</td>
                    <td className="px-5 py-4 text-center">{t._count?.products || 0}</td>
                    <td className="px-5 py-4 text-center">{t._count?.transactions || 0}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${t.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                        {t.status === "ACTIVE" ? "AKTIF" : "DITANGGUHKAN"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${t.status === "ACTIVE" ? "border-rose-200 text-rose-700 hover:bg-rose-50" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"}`}
                        onClick={() => toggleMut.mutate({ id: t.id, status: t.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" })}
                      >
                        {t.status === "ACTIVE" ? <><ToggleRight size={14} /> Tangguhkan</> : <><ToggleLeft size={14} /> Aktifkan</>}
                      </button>
                    </td>
                  </tr>
                ))}
                {tenants.length === 0 && <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400">Belum ada toko yang terdaftar</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
