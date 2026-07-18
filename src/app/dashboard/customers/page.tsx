"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { customerApi } from "@/lib/api";
import { Plus, Search, Pencil, Trash2, X, Loader2 } from "lucide-react";

export default function CustomersPage() {
  const { token, canManage } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });

  const { data: customers = [], isLoading } = useQuery({ queryKey: ["customers", search], queryFn: () => customerApi.list(token!, search || undefined), enabled: !!token });
  const createMut = useMutation({ mutationFn: (d: any) => customerApi.create(token!, d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["customers"] }); setModal(null); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }: any) => customerApi.update(token!, id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["customers"] }); setModal(null); } });
  const deleteMut = useMutation({ mutationFn: (id: string) => customerApi.delete(token!, id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }) });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full sm:min-w-64 sm:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-teal-600" placeholder="Cari pelanggan..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {canManage && (
          <button className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 sm:h-10 sm:w-auto" onClick={() => { setForm({ name: "", phone: "", email: "", address: "" }); setEditing(null); setModal("create"); }}>
            <Plus size={16} /> Tambah Pelanggan
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map((c: any) => (
            <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">
                  {c.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.phone || c.email || "Tidak ada kontak"}</p>
                  <p className="mt-1 text-xs text-slate-400">{c._count?.transactions || 0} transaksi</p>
                </div>
                {canManage && (
                  <div className="flex gap-1">
                    <button className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-teal-50 hover:text-teal-600" onClick={() => { setForm({ name: c.name, phone: c.phone || "", email: c.email || "", address: c.address || "" }); setEditing(c); setModal("edit"); }}><Pencil size={14} /></button>
                    <button className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => { if (confirm("Hapus pelanggan ini?")) deleteMut.mutate(c.id); }}><Trash2 size={14} /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {customers.length === 0 && <p className="col-span-full py-12 text-center text-sm text-slate-400">Pelanggan tidak ditemukan</p>}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-3 sm:p-4" onClick={() => setModal(null)}>
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-4 shadow-2xl sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h3 className="text-lg font-bold">{modal === "create" ? "Tambah Pelanggan Baru" : "Ubah Data Pelanggan"}</h3><button onClick={() => setModal(null)}><X size={20} /></button></div>
            <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); if (modal === "edit") updateMut.mutate({ id: editing.id, data: form }); else createMut.mutate(form); }}>
              <div><label className="text-xs font-medium text-slate-600">Nama Pelanggan *</label><input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="text-xs font-medium text-slate-600">Nomor Telepon</label><input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><label className="text-xs font-medium text-slate-600">Alamat Email</label><input type="email" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div><label className="text-xs font-medium text-slate-600">Alamat</label><input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <button type="submit" className="h-10 w-full rounded-lg bg-slate-950 text-sm font-bold text-white">{modal === "create" ? "Tambah Pelanggan" : "Simpan Perubahan"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
