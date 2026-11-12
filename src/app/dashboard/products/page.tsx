"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { productApi, categoryApi } from "@/lib/api";
import { useFeatures } from "@/lib/useFeatures";
import { Plus, Search, Pencil, Trash2, X, Loader2, Package, ImageUp } from "lucide-react";
import styles from "./products.module.css";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

export default function ProductsPage() {
  const { token, canManage } = useAuth();
  const { hasFeature } = useFeatures();
  const hasAllProductFeatures = hasFeature("WHOLESALE_PRICING") && hasFeature("MULTI_UNIT") && hasFeature("EXPIRY_DATE");
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formError, setFormError] = useState("");
  const emptyForm = () => ({ name: "", sku: "", barcode: "", description: "", purchasePrice: 0, sellingPrice: 0, wholesalePrice: "" as number | "", baseUnit: "pcs", units: [] as any[], expiresAt: "", stock: 0, minStock: 0, categoryId: "", status: "ACTIVE" });
  const [form, setForm] = useState(emptyForm);

  const { data: products = [], isLoading } = useQuery({ queryKey: ["products", search, catFilter], queryFn: () => productApi.list(token!, search || undefined, catFilter || undefined), enabled: !!token });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: () => categoryApi.list(token!), enabled: !!token });

  const createMut = useMutation({ mutationFn: (d: any) => productApi.create(token!, d), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }) });
  const updateMut = useMutation({ mutationFn: ({ id, data }: any) => productApi.update(token!, id, data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }) });
  const uploadImageMut = useMutation({ mutationFn: ({ id, file }: { id: string; file: File }) => productApi.uploadImage(token!, id, file), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }) });
  const deleteMut = useMutation({ mutationFn: (id: string) => productApi.delete(token!, id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }) });

  function openCreate() { setForm(emptyForm()); setEditingProduct(null); setImageFile(null); setFormError(""); setModal("create"); }
  function openEdit(p: any) { setForm({ ...emptyForm(), name: p.name, sku: p.sku, barcode: p.barcode || "", description: p.description || "", purchasePrice: p.purchasePrice, sellingPrice: p.sellingPrice, wholesalePrice: p.wholesalePrice ?? "", baseUnit: p.baseUnit || "pcs", units: p.units || [], expiresAt: p.expiresAt ? new Date(p.expiresAt).toISOString().slice(0, 10) : "", stock: p.stock, minStock: p.minStock, categoryId: p.categoryId || "", status: p.status }); setEditingProduct(p); setImageFile(null); setFormError(""); setModal("edit"); }
  function closeModal() { setModal(null); setEditingProduct(null); setImageFile(null); setFormError(""); }

  function productPayload(includeStatus: boolean) {
    return {
      name: form.name.trim(),
      sku: form.sku.trim(),
      barcode: form.barcode.trim() || undefined,
      description: form.description.trim() || undefined,
      purchasePrice: Number(form.purchasePrice),
      sellingPrice: Number(form.sellingPrice),
      ...(hasFeature("WHOLESALE_PRICING") ? { wholesalePrice: form.wholesalePrice === "" ? null : Number(form.wholesalePrice) } : {}),
      ...(hasFeature("MULTI_UNIT") ? { baseUnit: form.baseUnit, units: form.units.filter((u: any) => u.name.trim()).map((u: any) => ({ name: u.name.trim(), conversionFactor: Number(u.conversionFactor), sellingPrice: Number(u.sellingPrice), wholesalePrice: u.wholesalePrice === "" ? undefined : Number(u.wholesalePrice) })) } : {}),
      ...(hasFeature("EXPIRY_DATE") ? { expiresAt: form.expiresAt || null } : {}),
      stock: Number(form.stock || 0),
      minStock: Number(form.minStock || 0),
      categoryId: form.categoryId || undefined,
      ...(includeStatus ? { status: form.status } : {}),
    };
  }

  async function saveProduct(product: any) {
    if (imageFile) {
      await uploadImageMut.mutateAsync({ id: product.id, file: imageFile });
    }
    closeModal();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    try {
      if (modal === "edit") {
        const product = await updateMut.mutateAsync({ id: editingProduct.id, data: productPayload(true) });
        await saveProduct(product);
      } else {
        const product = await createMut.mutateAsync(productPayload(false));
        await saveProduct(product);
      }
    } catch (error: any) {
      setFormError(error?.message || "Gagal menyimpan data produk");
    }
  }

  const isSaving = createMut.isPending || updateMut.isPending || uploadImageMut.isPending;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full sm:min-w-64 sm:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-teal-600" placeholder="Cari produk..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm sm:h-10 sm:w-auto" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
          <option value="">Semua kategori</option>
          {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {canManage && (
          <button className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 sm:h-10 sm:w-auto" onClick={openCreate}>
            <Plus size={16} /> Tambah Produk
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
      ) : (
        <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${styles.tableViewport}`} role="region" aria-label="Tabel produk" tabIndex={0}>
          <table className={`responsive-table w-full text-sm ${styles.productsTable} ${hasAllProductFeatures ? styles.fullFeatureTable : styles.compactTable}`}>
            <thead><tr className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
              <th className={`px-4 py-3 ${styles.productColumn}`}>Produk</th><th className={`px-4 py-3 ${styles.skuColumn}`}>SKU</th><th className={`px-4 py-3 ${styles.categoryColumn}`}>Kategori</th>
              <th className={`px-4 py-3 text-right ${styles.priceColumn}`}>Harga Beli</th><th className={`px-4 py-3 text-right ${styles.priceColumn}`}>Harga Jual</th>
              {hasFeature("WHOLESALE_PRICING") && <th className={`px-4 py-3 text-right ${styles.priceColumn}`}>Harga Bakul</th>}
              {hasFeature("MULTI_UNIT") && <th className={`px-4 py-3 ${styles.unitColumn}`}>Satuan</th>}
              {hasFeature("EXPIRY_DATE") && <th className={`px-4 py-3 ${styles.expiryColumn}`}>Kedaluwarsa</th>}
              <th className={`px-4 py-3 text-right ${styles.stockColumn}`}>Stok</th><th className={`px-4 py-3 ${styles.statusColumn}`}>Status</th>
              {canManage && <th className={`px-4 py-3 text-right ${styles.actionsColumn}`}>Aksi</th>}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className={`px-4 py-3 font-semibold text-slate-900 ${styles.productColumn}`} data-label="Produk">
                    <div className="flex items-center gap-3">
                      <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100 text-slate-400">
                        {p.image ? <img src={p.image} alt="" className="h-full w-full object-cover" /> : <Package size={17} />}
                      </div>
                      <span className="min-w-0 break-words">{p.name}</span>
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-slate-500 ${styles.skuColumn}`} data-label="SKU">{p.sku}</td>
                  <td className={`px-4 py-3 ${styles.categoryColumn}`} data-label="Kategori">{p.category ? <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold">{p.category.name}</span> : "—"}</td>
                  <td className={`px-4 py-3 text-right ${styles.priceColumn}`} data-label="Harga Beli">{formatCurrency(p.purchasePrice)}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${styles.priceColumn}`} data-label="Harga Jual">{formatCurrency(p.sellingPrice)}</td>
                  {hasFeature("WHOLESALE_PRICING") && <td className={`px-4 py-3 text-right ${styles.priceColumn}`} data-label="Harga Bakul">{p.wholesalePrice != null ? formatCurrency(p.wholesalePrice) : "—"}</td>}
                  {hasFeature("MULTI_UNIT") && <td className={`px-4 py-3 ${styles.unitColumn}`} data-label="Satuan">{p.baseUnit}{p.units?.length ? ` · ${p.units.map((u: any) => u.name).join(", ")}` : ""}</td>}
                  {hasFeature("EXPIRY_DATE") && <td className={`px-4 py-3 ${styles.expiryColumn}`} data-label="Kedaluwarsa">{p.expiresAt ? new Date(p.expiresAt).toLocaleDateString("id-ID") : "—"}</td>}
                  <td className={`px-4 py-3 text-right ${styles.stockColumn}`} data-label="Stok">
                    <span className={`font-semibold ${p.stock <= p.minStock ? "text-rose-600" : "text-emerald-600"}`}>{p.stock}</span>
                  </td>
                  <td className={`px-4 py-3 ${styles.statusColumn}`} data-label="Status"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${p.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{p.status === "ACTIVE" ? "AKTIF" : "NONAKTIF"}</span></td>
                  {canManage && (
                    <td className={`mobile-actions px-4 py-3 text-right ${styles.actionsColumn}`} data-label="Aksi">
                      <button className="mr-2 inline-grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-teal-50 hover:text-teal-600" onClick={() => openEdit(p)}><Pencil size={15} /></button>
                      <button className="inline-grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => { if (confirm("Hapus produk ini?")) deleteMut.mutate(p.id); }}><Trash2 size={15} /></button>
                    </td>
                  )}
                </tr>
              ))}
              {products.length === 0 && <tr><td colSpan={3 + 2 + (hasFeature("WHOLESALE_PRICING") ? 1 : 0) + (hasFeature("MULTI_UNIT") ? 1 : 0) + (hasFeature("EXPIRY_DATE") ? 1 : 0) + 1 + 1 + (canManage ? 1 : 0)} className="px-4 py-12 text-center text-slate-400">Produk tidak ditemukan</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-3 sm:p-4" onClick={closeModal}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-4 shadow-2xl sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h3 className="text-lg font-bold">{modal === "create" ? "Tambah Produk Baru" : "Ubah Produk"}</h3><button onClick={closeModal}><X size={20} /></button></div>
            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="text-xs font-medium text-slate-600">Nama Produk *</label><input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><label className="text-xs font-medium text-slate-600">SKU *</label><input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
              </div>
              {hasFeature("WHOLESALE_PRICING") && <div><label className="text-xs font-medium text-slate-600">Harga Bakul (opsional)</label><input type="number" min="0" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.wholesalePrice} onChange={(e) => setForm({ ...form, wholesalePrice: e.target.value === "" ? "" : +e.target.value })} /></div>}
              {hasFeature("MULTI_UNIT") && <div className="space-y-2 rounded-lg border border-slate-200 p-3"><div><label className="text-xs font-medium text-slate-600">Satuan stok dasar</label><input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.baseUnit} onChange={(e) => setForm({ ...form, baseUnit: e.target.value })} placeholder="pcs atau gram" /></div><p className="text-xs font-semibold text-slate-700">Satuan jual tambahan</p>{form.units.map((unit: any, index: number) => <div key={index} className="grid grid-cols-2 gap-2"><input className="h-9 rounded border px-2 text-sm" placeholder="Nama, mis. Dus" value={unit.name} onChange={(e) => setForm({ ...form, units: form.units.map((u: any, i: number) => i === index ? { ...u, name: e.target.value } : u) })} /><input type="number" min="1" className="h-9 rounded border px-2 text-sm" placeholder={`Isi (${form.baseUnit})`} value={unit.conversionFactor} onChange={(e) => setForm({ ...form, units: form.units.map((u: any, i: number) => i === index ? { ...u, conversionFactor: +e.target.value } : u) })} /><input type="number" min="0" className="h-9 rounded border px-2 text-sm" placeholder="Harga umum" value={unit.sellingPrice} onChange={(e) => setForm({ ...form, units: form.units.map((u: any, i: number) => i === index ? { ...u, sellingPrice: +e.target.value } : u) })} /><input type="number" min="0" className="h-9 rounded border px-2 text-sm" placeholder="Harga bakul (opsional)" value={unit.wholesalePrice ?? ""} onChange={(e) => setForm({ ...form, units: form.units.map((u: any, i: number) => i === index ? { ...u, wholesalePrice: e.target.value === "" ? "" : +e.target.value } : u) })} /></div>)}<button type="button" className="text-xs font-semibold text-teal-700" onClick={() => setForm({ ...form, units: [...form.units, { name: "", conversionFactor: 1, sellingPrice: 0, wholesalePrice: "" }] })}>+ Tambah satuan</button></div>}
              {hasFeature("EXPIRY_DATE") && <div><label className="text-xs font-medium text-slate-600">Tanggal kedaluwarsa</label><input type="date" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} /></div>}
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="text-xs font-medium text-slate-600">Barcode</label><input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} /></div>
                <div><label className="text-xs font-medium text-slate-600">Kategori</label><select className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}><option value="">Tidak ada</option>{categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="text-xs font-medium text-slate-600">Harga Beli *</label><input type="number" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" required value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: +e.target.value })} /></div>
                <div><label className="text-xs font-medium text-slate-600">Harga Jual *</label><input type="number" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" required value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: +e.target.value })} /></div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="text-xs font-medium text-slate-600">Stok Awal</label><input type="number" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.stock} onChange={(e) => setForm({ ...form, stock: +e.target.value })} /></div>
                <div><label className="text-xs font-medium text-slate-600">Stok Minimum</label><input type="number" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: +e.target.value })} /></div>
              </div>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-600 hover:border-teal-400 hover:bg-teal-50/40">
                <ImageUp size={18} className="text-teal-700" />
                <span className="flex-1 truncate">{imageFile ? imageFile.name : "Unggah gambar produk (PNG, JPG, WebP)"}</span>
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
              </label>
              <div><label className="text-xs font-medium text-slate-600">Keterangan / Deskripsi</label><textarea className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              {formError && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{formError}</p>}
              <button type="submit" disabled={isSaving} className="flex h-10 w-full items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-white disabled:opacity-50">
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : modal === "create" ? "Tambah Produk" : "Simpan Perubahan"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
