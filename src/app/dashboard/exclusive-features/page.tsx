"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { exclusiveFeatureApi, tenantApi } from "@/lib/api";
import {
  Loader2, Sparkles, Plus, Pencil, Trash2, Building2,
  ToggleLeft, ToggleRight, Check, X, AlertTriangle,
} from "lucide-react";

export default function ExclusiveFeaturesPage() {
  const { token, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"master" | "assign">("master");

  // ─── Master fitur ───────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ code: "", name: "", description: "", category: "POS" });

  // ─── Assign tab ─────────────────────────────────────
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");

  // Queries
  const { data: features = [], isLoading: featuresLoading } = useQuery({
    queryKey: ["exclusive-features"],
    queryFn: () => exclusiveFeatureApi.list(token!),
    enabled: !!token && isSuperAdmin,
  });

  const { data: tenantsData } = useQuery({
    queryKey: ["admin-tenants"],
    queryFn: () => tenantApi.list(token!),
    enabled: !!token && isSuperAdmin,
  });
  const tenants = tenantsData?.data || [];

  const { data: tenantFeatures = [], isLoading: tenantFeaturesLoading } = useQuery({
    queryKey: ["tenant-features-admin", selectedTenantId],
    queryFn: () => exclusiveFeatureApi.tenantFeatures(token!, selectedTenantId),
    enabled: !!token && !!selectedTenantId && isSuperAdmin,
  });

  // Mutations
  const createMut = useMutation({
    mutationFn: (data: any) => exclusiveFeatureApi.create(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exclusive-features"] });
      resetForm();
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => exclusiveFeatureApi.update(token!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exclusive-features"] });
      resetForm();
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => exclusiveFeatureApi.delete(token!, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exclusive-features"] }),
  });

  const toggleMasterMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      exclusiveFeatureApi.update(token!, id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exclusive-features"] }),
  });

  const assignMut = useMutation({
    mutationFn: (data: { tenantId: string; featureId: string }) =>
      exclusiveFeatureApi.assign(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-features-admin", selectedTenantId] });
      queryClient.invalidateQueries({ queryKey: ["exclusive-features"] });
    },
  });

  const toggleAssignMut = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      exclusiveFeatureApi.updateAssignment(token!, id, { enabled }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["tenant-features-admin", selectedTenantId] }),
  });

  const removeAssignMut = useMutation({
    mutationFn: (id: string) => exclusiveFeatureApi.removeAssignment(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-features-admin", selectedTenantId] });
      queryClient.invalidateQueries({ queryKey: ["exclusive-features"] });
    },
  });

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setFormData({ code: "", name: "", description: "", category: "POS" });
  }

  function startEdit(feature: any) {
    setEditingId(feature.id);
    setFormData({
      code: feature.code,
      name: feature.name,
      description: feature.description || "",
      category: feature.category,
    });
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) {
      updateMut.mutate({ id: editingId, data: { name: formData.name, description: formData.description, category: formData.category } });
    } else {
      createMut.mutate(formData);
    }
  }

  // Check which features are assigned to selected tenant
  const _assignedFeatureIds = new Set(tenantFeatures.map((tf: any) => tf.featureId));

  if (!isSuperAdmin) {
    return <p className="py-20 text-center text-slate-500">Akses ditolak. Halaman ini hanya untuk Super Admin.</p>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Fitur Eksklusif</h2>
          <p className="text-sm text-slate-500">Kelola dan assign fitur premium untuk setiap toko</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
        <button
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            tab === "master" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
          onClick={() => setTab("master")}
        >
          <span className="flex items-center justify-center gap-2">
            <Sparkles size={16} />
            Master Fitur
          </span>
        </button>
        <button
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            tab === "assign" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
          onClick={() => setTab("assign")}
        >
          <span className="flex items-center justify-center gap-2">
            <Building2 size={16} />
            Assign ke Toko
          </span>
        </button>
      </div>

      {/* ═══ TAB: Master Fitur ═══ */}
      {tab === "master" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              className="flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              onClick={() => { resetForm(); setShowForm(true); }}
            >
              <Plus size={16} />
              Tambah Fitur
            </button>
          </div>

          {/* Create/Edit form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-bold text-slate-950">
                {editingId ? "Edit Fitur" : "Tambah Fitur Baru"}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Kode</label>
                  <input
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 disabled:bg-slate-50"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g, "_") })}
                    placeholder="PAYMENT_SYSTEM"
                    disabled={!!editingId}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Nama</label>
                  <input
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Sistem Pembayaran"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-600">Deskripsi</label>
                  <textarea
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Deskripsi fitur..."
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Kategori</label>
                  <select
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="POS">POS</option>
                    <option value="GENERAL">General</option>
                    <option value="REPORTING">Reporting</option>
                    <option value="INTEGRATION">Integration</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="submit"
                  disabled={createMut.isPending || updateMut.isPending}
                  className="flex h-10 items-center gap-2 rounded-lg bg-teal-700 px-5 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:opacity-50"
                >
                  {(createMut.isPending || updateMut.isPending) ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {editingId ? "Simpan Perubahan" : "Tambah Fitur"}
                </button>
                <button type="button" onClick={resetForm} className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                  <X size={16} />
                  Batal
                </button>
              </div>
              {(createMut.isError || updateMut.isError) && (
                <p className="mt-2 text-xs text-red-600">{((createMut.error || updateMut.error) as any)?.message || "Gagal menyimpan fitur"}</p>
              )}
            </form>
          )}

          {/* Feature list */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-lg font-bold text-slate-950">Daftar Fitur Eksklusif</h3>
            </div>
            {featuresLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
            ) : features.length === 0 ? (
              <div className="px-5 py-12 text-center text-slate-400">Belum ada fitur eksklusif. Klik &quot;Tambah Fitur&quot; untuk membuat.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
                      <th className="px-5 py-3">Kode</th>
                      <th className="px-5 py-3">Nama</th>
                      <th className="px-5 py-3">Kategori</th>
                      <th className="px-5 py-3 text-center">Toko Aktif</th>
                      <th className="px-5 py-3 text-center">Status</th>
                      <th className="px-5 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {features.map((feature: any) => (
                      <tr key={feature.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <code className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">{feature.code}</code>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">{feature.name}</p>
                          {feature.description && (
                            <p className="mt-0.5 max-w-xs truncate text-xs text-slate-500">{feature.description}</p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-[10px] font-bold text-violet-700">{feature.category}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="font-bold text-slate-900">{feature._count?.tenantFeatures || 0}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => toggleMasterMut.mutate({ id: feature.id, isActive: !feature.isActive })}
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold transition ${
                              feature.isActive
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                            }`}
                          >
                            {feature.isActive ? <><ToggleRight size={12} /> AKTIF</> : <><ToggleLeft size={12} /> NONAKTIF</>}
                          </button>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              className="grid size-8 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                              onClick={() => startEdit(feature)}
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              className="grid size-8 place-items-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                              onClick={() => {
                                if (confirm(`Hapus fitur "${feature.name}"? Semua assignment ke toko juga akan terhapus.`)) {
                                  deleteMut.mutate(feature.id);
                                }
                              }}
                              title="Hapus"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ TAB: Assign ke Toko ═══ */}
      {tab === "assign" && (
        <div className="space-y-4">
          {/* Tenant selector */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Pilih Toko</label>
            <select
              className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
            >
              <option value="">— Pilih toko —</option>
              {tenants.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name} ({t.slug})</option>
              ))}
            </select>
          </div>

          {selectedTenantId && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="text-lg font-bold text-slate-950">
                  Fitur untuk: {tenants.find((t: any) => t.id === selectedTenantId)?.name}
                </h3>
                <p className="text-xs text-slate-500">Toggle untuk mengaktifkan atau menonaktifkan fitur per toko</p>
              </div>

              {tenantFeaturesLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
              ) : features.length === 0 ? (
                <div className="px-5 py-12 text-center text-slate-400">
                  <AlertTriangle className="mx-auto mb-2 text-amber-400" size={24} />
                  Belum ada fitur eksklusif. Buat dulu di tab &quot;Master Fitur&quot;.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {features.map((feature: any) => {
                    const assignment = tenantFeatures.find((tf: any) => tf.featureId === feature.id);
                    const isAssigned = !!assignment;
                    const isEnabled = assignment?.enabled ?? false;

                    return (
                      <div key={feature.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <code className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{feature.code}</code>
                            <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">{feature.category}</span>
                            {!feature.isActive && (
                              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">MASTER NONAKTIF</span>
                            )}
                          </div>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{feature.name}</p>
                          {feature.description && (
                            <p className="mt-0.5 text-xs text-slate-500">{feature.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {isAssigned ? (
                            <>
                              <button
                                onClick={() => toggleAssignMut.mutate({ id: assignment.id, enabled: !isEnabled })}
                                disabled={toggleAssignMut.isPending}
                                className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition ${
                                  isEnabled
                                    ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                    : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
                                }`}
                              >
                                {isEnabled ? <><ToggleRight size={14} /> Aktif</> : <><ToggleLeft size={14} /> Nonaktif</>}
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm("Hapus assignment fitur ini dari toko?")) {
                                    removeAssignMut.mutate(assignment.id);
                                  }
                                }}
                                disabled={removeAssignMut.isPending}
                                className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                title="Hapus assignment"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => assignMut.mutate({ tenantId: selectedTenantId, featureId: feature.id })}
                              disabled={assignMut.isPending || !feature.isActive}
                              className="flex h-9 items-center gap-1.5 rounded-lg border border-teal-300 bg-teal-50 px-4 text-xs font-semibold text-teal-700 transition hover:bg-teal-100 disabled:opacity-40"
                            >
                              <Plus size={14} />
                              Assign
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {!selectedTenantId && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
              <Building2 className="mx-auto mb-3 text-slate-300" size={36} />
              <p className="text-sm font-semibold text-slate-600">Pilih toko di atas</p>
              <p className="mt-1 text-xs text-slate-400">untuk melihat dan mengelola fitur eksklusif yang di-assign</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
