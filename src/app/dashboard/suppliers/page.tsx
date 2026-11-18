"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { invalidateQueries, removeItemFromQueries } from "@/lib/queryInvalidation";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { supplierApi } from "@/lib/api";
import { Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";

export default function SuppliersPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<any>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", contactPerson: "" });

  const { data: suppliers = [], isLoading } = useQuery({ queryKey: ["suppliers"], queryFn: () => supplierApi.list(token!), enabled: !!token });
  const supplierKeys = [["suppliers"], ["purchase-orders"]];
  const createMut = useMutation({ mutationFn: (d: any) => supplierApi.create(token!, d), onSuccess: async () => { await invalidateQueries(queryClient, supplierKeys); setModal(null); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }: any) => supplierApi.update(token!, id, data), onSuccess: async () => { await invalidateQueries(queryClient, supplierKeys); setModal(null); } });
  const savePending = createMut.isPending || updateMut.isPending;
  const deleteMut = useMutation({
    mutationFn: (id: string) => supplierApi.delete(token!, id),
    onSuccess: async (_result, id) => {
      removeItemFromQueries(queryClient, [["suppliers"]], id);
      await invalidateQueries(queryClient, supplierKeys);
      setSupplierToDelete(null);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">{suppliers.length} pemasok</p>
        <button className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 sm:h-10 sm:w-auto" onClick={() => { createMut.reset(); updateMut.reset(); setForm({ name: "", phone: "", email: "", address: "", contactPerson: "" }); setEditing(null); setModal("create"); }}>
          <Plus size={16} /> Tambah Pemasok
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="responsive-table w-full text-sm">
            <thead><tr className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
              <th className="px-4 py-3">Nama Pemasok</th><th className="px-4 py-3">Contact Person</th><th className="px-4 py-3">Nomor Telepon</th><th className="px-4 py-3">Email</th><th className="px-4 py-3 text-right">Jumlah PO</th><th className="px-4 py-3 text-right">Aksi</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {suppliers.map((s: any) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{s.name}</td>
                  <td className="px-4 py-3">{s.contactPerson || "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{s.phone || "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{s.email || "—"}</td>
                  <td className="px-4 py-3 text-right">{s._count?.purchaseOrders || 0}</td>
                  <td className="px-4 py-3 text-right">
                    <button aria-label={`Ubah pemasok ${s.name}`} className="mr-2 text-slate-400 hover:text-teal-600" onClick={() => { createMut.reset(); updateMut.reset(); setForm({ name: s.name, phone: s.phone || "", email: s.email || "", address: s.address || "", contactPerson: s.contactPerson || "" }); setEditing(s); setModal("edit"); }}><Pencil size={15} /></button>
                    <button aria-label={`Hapus pemasok ${s.name}`} className="text-slate-400 hover:text-red-600" onClick={() => { deleteMut.reset(); setSupplierToDelete(s); }}><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">Belum ada data pemasok</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-3 sm:p-4" onClick={() => { if (!savePending) setModal(null); }}>
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-4 shadow-2xl sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h3 className="text-lg font-bold">{modal === "create" ? "Tambah Pemasok Baru" : "Ubah Data Pemasok"}</h3><button type="button" disabled={savePending} onClick={() => setModal(null)} aria-label="Tutup" className="disabled:opacity-50"><X size={20} /></button></div>
            <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); if (modal === "edit") updateMut.mutate({ id: editing.id, data: form }); else createMut.mutate(form); }}>
              <div><label className="text-xs font-medium text-slate-600">Nama Pemasok *</label><input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="text-xs font-medium text-slate-600">Contact Person</label><input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} /></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="text-xs font-medium text-slate-600">Nomor Telepon</label><input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><label className="text-xs font-medium text-slate-600">Alamat Email</label><input type="email" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div><label className="text-xs font-medium text-slate-600">Alamat</label><input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              {(createMut.isError || updateMut.isError) && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{((createMut.error || updateMut.error) as any)?.message || "Gagal menyimpan pemasok."}</p>}
              <button type="submit" disabled={savePending} className="h-10 w-full rounded-lg bg-slate-950 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60">{savePending ? "Menyimpan…" : modal === "create" ? "Tambah Pemasok" : "Simpan Perubahan"}</button>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!supplierToDelete}
        title="Hapus pemasok ini?"
        description={<>Pemasok <strong className="font-semibold text-slate-900">{supplierToDelete?.name}</strong>{supplierToDelete?.email ? <> ({supplierToDelete.email})</> : null} akan dihapus. Tindakan ini tidak dapat dibatalkan.</>}
        isPending={deleteMut.isPending}
        error={deleteMut.isError ? (deleteMut.error as any)?.message || "Pemasok gagal dihapus. Silakan coba lagi." : undefined}
        onCancel={() => { if (!deleteMut.isPending) setSupplierToDelete(null); }}
        onConfirm={() => { if (supplierToDelete && !deleteMut.isPending) deleteMut.mutate(supplierToDelete.id); }}
      />
    </div>
  );
}
