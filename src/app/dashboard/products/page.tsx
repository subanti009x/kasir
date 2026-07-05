"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { productApi, categoryApi } from "@/lib/api";
import { Plus, Search, Pencil, Trash2, X, Loader2, Package } from "lucide-react";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

export default function ProductsPage() {
  const { token, canManage } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [form, setForm] = useState({ name: "", sku: "", barcode: "", description: "", purchasePrice: 0, sellingPrice: 0, stock: 0, minStock: 0, categoryId: "", status: "ACTIVE" });

  const { data: products = [], isLoading } = useQuery({ queryKey: ["products", search, catFilter], queryFn: () => productApi.list(token!, search || undefined, catFilter || undefined), enabled: !!token });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: () => categoryApi.list(token!), enabled: !!token });

  const createMut = useMutation({ mutationFn: (d: any) => productApi.create(token!, d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["products"] }); closeModal(); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }: any) => productApi.update(token!, id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["products"] }); closeModal(); } });
  const deleteMut = useMutation({ mutationFn: (id: string) => productApi.delete(token!, id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }) });

  function openCreate() { setForm({ name: "", sku: "", barcode: "", description: "", purchasePrice: 0, sellingPrice: 0, stock: 0, minStock: 0, categoryId: "", status: "ACTIVE" }); setEditingProduct(null); setModal("create"); }
  function openEdit(p: any) { setForm({ name: p.name, sku: p.sku, barcode: p.barcode || "", description: p.description || "", purchasePrice: p.purchasePrice, sellingPrice: p.sellingPrice, stock: p.stock, minStock: p.minStock, categoryId: p.categoryId || "", status: p.status }); setEditingProduct(p); setModal("edit"); }
  function closeModal() { setModal(null); setEditingProduct(null); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = { ...form, purchasePrice: +form.purchasePrice, sellingPrice: +form.sellingPrice, stock: +form.stock, minStock: +form.minStock, categoryId: form.categoryId || undefined };
    if (modal === "edit") updateMut.mutate({ id: editingProduct.id, data });
    else createMut.mutate(data);
  }

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-teal-600" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="h-10 rounded-lg border border-slate-200 px-3 text-sm" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {canManage && (
          <button className="flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800" onClick={openCreate}>
            <Plus size={16} /> Add Product
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
              <th className="px-4 py-3">Product</th><th className="px-4 py-3">SKU</th><th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Purchase</th><th className="px-4 py-3 text-right">Selling</th>
              <th className="px-4 py-3 text-right">Stock</th><th className="px-4 py-3">Status</th>
              {canManage && <th className="px-4 py-3 text-right">Actions</th>}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{p.name}</td>
                  <td className="px-4 py-3 text-slate-500">{p.sku}</td>
                  <td className="px-4 py-3">{p.category ? <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold">{p.category.name}</span> : "—"}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(p.purchasePrice)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatCurrency(p.sellingPrice)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-semibold ${p.stock <= p.minStock ? "text-rose-600" : "text-emerald-600"}`}>{p.stock}</span>
                  </td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${p.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{p.status}</span></td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      <button className="mr-2 text-slate-400 hover:text-teal-600" onClick={() => openEdit(p)}><Pencil size={15} /></button>
                      <button className="text-slate-400 hover:text-red-600" onClick={() => { if (confirm("Delete this product?")) deleteMut.mutate(p.id); }}><Trash2 size={15} /></button>
                    </td>
                  )}
                </tr>
              ))}
              {products.length === 0 && <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">No products found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={closeModal}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h3 className="text-lg font-bold">{modal === "create" ? "Add Product" : "Edit Product"}</h3><button onClick={closeModal}><X size={20} /></button></div>
            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-slate-600">Name *</label><input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><label className="text-xs font-medium text-slate-600">SKU *</label><input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-slate-600">Barcode</label><input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} /></div>
                <div><label className="text-xs font-medium text-slate-600">Category</label><select className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}><option value="">None</option>{categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-slate-600">Purchase Price *</label><input type="number" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" required value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: +e.target.value })} /></div>
                <div><label className="text-xs font-medium text-slate-600">Selling Price *</label><input type="number" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" required value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: +e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-slate-600">Stock</label><input type="number" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.stock} onChange={(e) => setForm({ ...form, stock: +e.target.value })} /></div>
                <div><label className="text-xs font-medium text-slate-600">Min Stock</label><input type="number" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: +e.target.value })} /></div>
              </div>
              <div><label className="text-xs font-medium text-slate-600">Description</label><textarea className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <button type="submit" disabled={isSaving} className="flex h-10 w-full items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-white disabled:opacity-50">
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : modal === "create" ? "Add Product" : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
