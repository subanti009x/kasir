"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { categoryApi } from "@/lib/api";
import { Plus, Pencil, Trash2, X, Loader2, Palette } from "lucide-react";

export default function CategoriesPage() {
  const { token, canManage } = useAuth();
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "", color: "#64748B" });

  const { data: categories = [], isLoading } = useQuery({ queryKey: ["categories"], queryFn: () => categoryApi.list(token!), enabled: !!token });

  const createMut = useMutation({ mutationFn: (d: any) => categoryApi.create(token!, d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["categories"] }); closeModal(); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }: any) => categoryApi.update(token!, id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["categories"] }); closeModal(); } });
  const deleteMut = useMutation({ mutationFn: (id: string) => categoryApi.delete(token!, id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }) });

  function closeModal() { setModal(null); setEditing(null); }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">{categories.length} kategori</p>
        {canManage && (
          <button className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 sm:h-10 sm:w-auto" onClick={() => { setForm({ name: "", description: "", color: "#64748B" }); setModal("create"); }}>
            <Plus size={16} /> Tambah Kategori
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c: any) => (
            <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-lg" style={{ backgroundColor: c.color || "#64748B" }}>
                  <Palette size={18} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{c.name}</p>
                  <p className="truncate text-xs text-slate-500">{c.description || "Tidak ada keterangan"}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                  {c._count?.products || 0} produk
                </span>
              </div>
              {canManage && (
                <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                  <button className="flex-1 h-8 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50" onClick={() => { setForm({ name: c.name, description: c.description || "", color: c.color || "#64748B" }); setEditing(c); setModal("edit"); }}>
                    <Pencil size={14} className="mr-1 inline" /> Ubah
                  </button>
                  <button className="h-8 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-red-600 hover:bg-red-50" onClick={() => { if (confirm("Hapus kategori ini?")) deleteMut.mutate(c.id); }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>
          ))}
          {categories.length === 0 && <p className="col-span-full py-12 text-center text-sm text-slate-400">Belum ada kategori produk</p>}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-3 sm:p-4" onClick={closeModal}>
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-4 shadow-2xl sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h3 className="text-lg font-bold">{modal === "create" ? "Tambah Kategori" : "Ubah Kategori"}</h3><button onClick={closeModal}><X size={20} /></button></div>
            <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); if (modal === "edit") updateMut.mutate({ id: editing.id, data: form }); else createMut.mutate(form); }}>
              <div><label className="text-xs font-medium text-slate-600">Nama Kategori *</label><input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="text-xs font-medium text-slate-600">Keterangan</label><input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><label className="text-xs font-medium text-slate-600">Pilih Warna</label><input type="color" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-1" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
              <button type="submit" className="h-10 w-full rounded-lg bg-slate-950 text-sm font-bold text-white">{modal === "create" ? "Tambah Kategori" : "Simpan Kategori"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
