"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { inventoryApi, productApi } from "@/lib/api";
import { Plus, X, Loader2, ArrowDownToLine, ArrowUpFromLine, RefreshCcw, Package } from "lucide-react";

export default function InventoryPage() {
  const { token, canManage } = useAuth();
  const queryClient = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ type: "STOCK_IN", productId: "", quantity: 1, note: "" });

  const { data: logs = [], isLoading } = useQuery({ queryKey: ["inventory"], queryFn: () => inventoryApi.list(token!), enabled: !!token });
  const { data: lowStock = [] } = useQuery({ queryKey: ["low-stock"], queryFn: () => inventoryApi.lowStock(token!), enabled: !!token });
  const { data: products = [] } = useQuery({ queryKey: ["products-all"], queryFn: () => productApi.list(token!), enabled: !!token });

  const createMut = useMutation({ mutationFn: (d: any) => inventoryApi.create(token!, d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["inventory"] }); queryClient.invalidateQueries({ queryKey: ["products"] }); queryClient.invalidateQueries({ queryKey: ["low-stock"] }); setModal(false); } });

  const typeIcons: Record<string, any> = { STOCK_IN: ArrowDownToLine, STOCK_OUT: ArrowUpFromLine, ADJUSTMENT: RefreshCcw };
  const typeColors: Record<string, string> = { STOCK_IN: "text-emerald-600 bg-emerald-50", STOCK_OUT: "text-rose-600 bg-rose-50", ADJUSTMENT: "text-amber-600 bg-amber-50" };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">{lowStock.length > 0 ? `${lowStock.length} produk di bawah batas minimum stok` : "Semua produk memiliki stok yang cukup"}</p>
        </div>
        {canManage && (
          <button className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 sm:h-10 sm:w-auto" onClick={() => { setForm({ type: "STOCK_IN", productId: "", quantity: 1, note: "" }); setModal(true); }}>
            <Plus size={16} /> Mutasi Stok
          </button>
        )}
      </div>

      {/* Low stock alerts */}
      {lowStock.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <h3 className="text-sm font-bold text-rose-800">⚠️ Produk Stok Menipis</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {lowStock.map((p: any) => (
              <span key={p.id} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-700 shadow-sm">
                {p.name}: {p.stock}/{p.minStock}
              </span>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="responsive-table w-full text-sm">
            <thead><tr className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
              <th className="px-4 py-3">Jenis Mutasi</th><th className="px-4 py-3">Produk</th><th className="px-4 py-3 text-right">Jumlah</th><th className="px-4 py-3 text-right">Stok Saat Ini</th><th className="px-4 py-3">Keterangan</th><th className="px-4 py-3">Tanggal</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((l: any) => {
                const Icon = typeIcons[l.type] || Package;
                return (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${typeColors[l.type]}`}><Icon size={12} />{l.type === "STOCK_IN" ? "Stok Masuk" : l.type === "STOCK_OUT" ? "Stok Keluar" : "Penyesuaian"}</span></td>
                    <td className="px-4 py-3 font-semibold">{l.product?.name || "—"}</td>
                    <td className={`px-4 py-3 text-right font-bold ${l.quantity > 0 ? "text-emerald-600" : "text-rose-600"}`}>{l.quantity > 0 ? `+${l.quantity}` : l.quantity}</td>
                    <td className="px-4 py-3 text-right">{l.product?.stock ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{l.note || "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(l.createdAt).toLocaleString("id-ID")}</td>
                  </tr>
                );
              })}
              {logs.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">Belum ada riwayat mutasi stok</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-3 sm:p-4" onClick={() => setModal(false)}>
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-4 shadow-2xl sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h3 className="text-lg font-bold">Mutasi Stok Baru</h3><button onClick={() => setModal(false)}><X size={20} /></button></div>
            <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); createMut.mutate({ ...form, quantity: +form.quantity }); }}>
              <div><label className="text-xs font-medium text-slate-600">Jenis Mutasi *</label>
                <select className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="STOCK_IN">Stok Masuk</option><option value="STOCK_OUT">Stok Keluar</option><option value="ADJUSTMENT">Penyesuaian Stok</option>
                </select>
              </div>
              <div><label className="text-xs font-medium text-slate-600">Produk *</label>
                <select className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" required value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
                  <option value="">Pilih produk...</option>
                  {products.map((p: any) => <option key={p.id} value={p.id}>{p.name} (Stok: {p.stock})</option>)}
                </select>
              </div>
              <div><label className="text-xs font-medium text-slate-600">Jumlah *</label><input type="number" min={1} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: +e.target.value })} /></div>
              <div><label className="text-xs font-medium text-slate-600">Catatan / Alasan</label><input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
              <button type="submit" disabled={createMut.isPending} className="h-10 w-full rounded-lg bg-slate-950 text-sm font-bold text-white disabled:opacity-50">
                {createMut.isPending ? <Loader2 className="inline animate-spin" size={18} /> : "Simpan Mutasi"}
              </button>
              {createMut.isError && <p className="text-xs text-red-600">{(createMut.error as any)?.message}</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
