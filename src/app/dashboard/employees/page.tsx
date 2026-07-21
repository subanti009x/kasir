"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { userApi } from "@/lib/api";
import { Pencil, Trash2, X, Loader2, UserPlus } from "lucide-react";

export default function EmployeesPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "CASHIER", status: "ACTIVE" });

  const { data: users = [], isLoading } = useQuery({ queryKey: ["users"], queryFn: () => userApi.list(token!), enabled: !!token });
  const createMut = useMutation({ mutationFn: (d: any) => userApi.create(token!, d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["users"] }); setModal(null); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }: any) => userApi.update(token!, id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["users"] }); setModal(null); } });
  const deleteMut = useMutation({ mutationFn: (id: string) => userApi.delete(token!, id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }) });

  const roleColors: Record<string, string> = { OWNER: "bg-violet-50 text-violet-700", CASHIER: "bg-sky-50 text-sky-700", SUPER_ADMIN: "bg-rose-50 text-rose-700" };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">{users.length} karyawan</p>
        <button className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 sm:h-10 sm:w-auto" onClick={() => { setForm({ name: "", email: "", password: "", role: "CASHIER", status: "ACTIVE" }); setEditing(null); setModal("create"); }}>
          <UserPlus size={16} /> Tambah Karyawan
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="responsive-table w-full text-sm">
            <thead><tr className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
              <th className="px-4 py-3">Karyawan</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Peran</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Tanggal Bergabung</th><th className="px-4 py-3 text-right">Aksi</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid size-8 place-items-center rounded-full bg-slate-200 text-xs font-bold">{u.name.charAt(0)}</div>
                      <span className="font-semibold">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{u.email}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${roleColors[u.role] || "bg-slate-100 text-slate-600"}`}>{u.role === "OWNER" ? "OWNER (PEMILIK)" : u.role === "CASHIER" ? "KASIR" : u.role}</span></td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${u.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{u.status === "ACTIVE" ? "AKTIF" : "NONAKTIF"}</span></td>
                  <td className="px-4 py-3 text-slate-500">{new Date(u.createdAt).toLocaleDateString("id-ID")}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="mr-2 text-slate-400 hover:text-teal-600" onClick={() => { setForm({ name: u.name, email: u.email, password: "", role: u.role, status: u.status }); setEditing(u); setModal("edit"); }}><Pencil size={15} /></button>
                    <button className="text-slate-400 hover:text-red-600" onClick={() => { if (confirm("Hapus karyawan ini?")) deleteMut.mutate(u.id); }}><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">Belum ada data karyawan</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-3 sm:p-4" onClick={() => setModal(null)}>
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-4 shadow-2xl sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h3 className="text-lg font-bold">{modal === "create" ? "Tambah Karyawan Baru" : "Ubah Data Karyawan"}</h3><button onClick={() => setModal(null)}><X size={20} /></button></div>
            <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); const data: any = { ...form }; if (!data.password) delete data.password; if (modal === "edit") updateMut.mutate({ id: editing.id, data }); else createMut.mutate(data); }}>
              <div><label className="text-xs font-medium text-slate-600">Nama Karyawan *</label><input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="text-xs font-medium text-slate-600">Alamat Email *</label><input type="email" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><label className="text-xs font-medium text-slate-600">{modal === "create" ? "Kata Sandi *" : "Kata Sandi (kosongkan jika tidak ingin diubah)"}</label><input type="password" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={modal === "create"} minLength={6} /></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="text-xs font-medium text-slate-600">Peran</label><select className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="CASHIER">Kasir</option><option value="OWNER">Pemilik (Owner)</option></select></div>
                <div><label className="text-xs font-medium text-slate-600">Status</label><select className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="ACTIVE">Aktif</option><option value="INACTIVE">Nonaktif</option></select></div>
              </div>
              <button type="submit" className="h-10 w-full rounded-lg bg-slate-950 text-sm font-bold text-white disabled:opacity-50" disabled={createMut.isPending || updateMut.isPending}>
                {(createMut.isPending || updateMut.isPending) ? <Loader2 className="inline animate-spin" size={18} /> : modal === "create" ? "Tambah Karyawan" : "Simpan Perubahan"}
              </button>
              {(createMut.isError || updateMut.isError) && <p className="text-xs text-red-600">{((createMut.error || updateMut.error) as any)?.message}</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
