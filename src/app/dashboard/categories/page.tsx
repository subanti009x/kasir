"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { categoryRelatedKeys, invalidateQueries, removeItemFromQueries } from "@/lib/queryInvalidation";
import { categoryApi } from "@/lib/api";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Plus, Pencil, Trash2, X, Loader2, Palette } from "lucide-react";

export default function CategoriesPage() {
  const { token, canManage } = useAuth();
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "", color: "#64748B" });

  const { data: categories = [], isLoading } = useQuery({ queryKey: ["categories"], queryFn: () => categoryApi.list(token!), enabled: !!token });

  const createMut = useMutation({ mutationFn: (d: any) => categoryApi.create(token!, d), onSuccess: async () => { await invalidateQueries(queryClient, categoryRelatedKeys); closeModal(); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }: any) => categoryApi.update(token!, id, data), onSuccess: async () => { await invalidateQueries(queryClient, categoryRelatedKeys); closeModal(); } });
  const savePending = createMut.isPending || updateMut.isPending;
  const deleteMut = useMutation({
    mutationFn: (id: string) => categoryApi.delete(token!, id),
    onSuccess: async (_result, id) => {
      removeItemFromQueries(queryClient, [["categories"]], id);
      await invalidateQueries(queryClient, categoryRelatedKeys);
      setCategoryToDelete(null);
    },
  });

  function closeModal() { setModal(null); setEditing(null); }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">{categories.length} kategori</p>
        {canManage && (
        <button className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 sm:h-10 sm:w-auto" onClick={() => { createMut.reset(); updateMut.reset(); setForm({ name: "", description: "", color: "#64748B" }); setModal("create"); }}>
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
                  <button className="flex-1 h-8 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50" onClick={() => { createMut.reset(); updateMut.reset(); setForm({ name: c.name, description: c.description || "", color: c.color || "#64748B" }); setEditing(c); setModal("edit"); }}>
                    <Pencil size={14} className="mr-1 inline" /> Ubah
                  </button>
                  <button aria-label={`Hapus kategori ${c.name}`} className="h-8 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-red-600 hover:bg-red-50" onClick={() => { deleteMut.reset(); setCategoryToDelete(c); }}>
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
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-3 sm:p-4" onClick={() => { if (!savePending) closeModal(); }}>
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-4 shadow-2xl sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h3 className="text-lg font-bold">{modal === "create" ? "Tambah Kategori" : "Ubah Kategori"}</h3><button type="button" disabled={savePending} onClick={closeModal} aria-label="Tutup" className="disabled:opacity-50"><X size={20} /></button></div>
            <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); if (modal === "edit") updateMut.mutate({ id: editing.id, data: form }); else createMut.mutate(form); }}>
              <div><label className="text-xs font-medium text-slate-600">Nama Kategori *</label><input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="text-xs font-medium text-slate-600">Keterangan</label><input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><label className="text-xs font-medium text-slate-600">Pilih Warna</label><input type="color" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-1" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
              {(createMut.isError || updateMut.isError) && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{((createMut.error || updateMut.error) as any)?.message || "Gagal menyimpan kategori."}</p>}
              <button type="submit" disabled={savePending} className="h-10 w-full rounded-lg bg-slate-950 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60">{savePending ? "Menyimpan…" : modal === "create" ? "Tambah Kategori" : "Simpan Kategori"}</button>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!categoryToDelete}
        title="Hapus kategori ini?"
        description={<>Kategori <strong className="font-semibold text-slate-900">{categoryToDelete?.name}</strong> akan dihapus. Tindakan ini tidak dapat dibatalkan.</>}
        isPending={deleteMut.isPending}
        error={deleteMut.isError ? (deleteMut.error as any)?.message || "Kategori gagal dihapus. Silakan coba lagi." : undefined}
        onCancel={() => { if (!deleteMut.isPending) setCategoryToDelete(null); }}
        onConfirm={() => { if (categoryToDelete && !deleteMut.isPending) deleteMut.mutate(categoryToDelete.id); }}
      />
    </div>
  );
}
