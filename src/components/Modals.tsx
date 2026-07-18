import { X, Printer, PackagePlus, ArrowDownUp, Trash2 } from "lucide-react";
import type { FormEvent } from "react";
import type { Receipt, ProductDraft, InventoryDraft, Product } from "../types";
import { formatCurrency } from "../utils";
import { TotalRow, Field } from "./UI";

export function ReceiptModal({ onClose, receipt }: { onClose: () => void; receipt: Receipt }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-3 sm:p-4">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-4 shadow-2xl sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Pembayaran Berhasil</p>
            <h2 className="mt-1 text-xl font-bold">Struk #{receipt.id}</h2>
            <p className="mt-1 text-sm text-slate-500">{receipt.date}</p>
          </div>
          <button
            aria-label="Tutup struk"
            className="grid size-9 place-items-center rounded-lg border border-slate-200"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-md bg-slate-950 text-xs font-bold text-white">
              POS
            </div>
            <div>
              <p className="text-sm font-bold">{receipt.tenantName}</p>
              <p className="text-xs text-slate-500">{receipt.address}</p>
              <p className="text-xs text-slate-500">{receipt.phone}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 text-xs text-slate-500 sm:grid-cols-2">
            <div>
              <p className="font-semibold text-slate-700">Kasir</p>
              <p>{receipt.cashier}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-700">Pembayaran</p>
              <p>{receipt.method}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          {receipt.lines.map((line) => (
            <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2" key={line.id}>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{line.name}</p>
                <p className="text-xs text-slate-500">
                  {line.quantity} x {formatCurrency(line.unitPrice)}
                </p>
              </div>
              <p className="text-sm font-bold">{formatCurrency(line.subtotal)}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm">
          <TotalRow label="Subtotal" value={formatCurrency(receipt.subtotal)} />
          <TotalRow label="Diskon" value={`-${formatCurrency(receipt.discount)}`} />
          <TotalRow label="Pajak" value={formatCurrency(receipt.tax)} />
          <div className="flex items-center justify-between pt-2 text-lg font-bold">
            <span>Total Bayar</span>
            <span>{formatCurrency(receipt.total)}</span>
          </div>
        </div>

        <button
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 text-sm font-bold text-white"
          onClick={onClose}
          type="button"
        >
          <Printer size={17} />
          Cetak Struk
        </button>
      </div>
    </div>
  );
}

export function ProductEditorModal({
  canDelete,
  draft,
  message,
  onChange,
  onClose,
  onDelete,
  onSubmit,
}: {
  canDelete: boolean;
  draft: ProductDraft;
  message: string;
  onChange: (draft: ProductDraft) => void;
  onClose: () => void;
  onDelete?: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const isEditing = Boolean(draft.id);

  function updateDraft(field: keyof ProductDraft, value: string) {
    onChange({ ...draft, [field]: value });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-3 sm:p-4">
      <form
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-4 shadow-2xl sm:p-5"
        onSubmit={onSubmit}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
              Kelola Produk
            </p>
            <h2 className="mt-1 text-xl font-bold">{isEditing ? "Ubah Produk" : "Tambah Produk Baru"}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Pencatatan data produk dengan kategori, SKU, barcode, harga, dan kontrol stok.
            </p>
          </div>
          <button
            aria-label="Tutup form produk"
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-200"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Nama produk">
            <input
              className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600"
              onChange={(event) => updateDraft("name", event.target.value)}
              placeholder="Contoh: Biji Kopi Arabika 250g"
              required
              value={draft.name}
            />
          </Field>
          <Field label="Kategori">
            <input
              className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600"
              onChange={(event) => updateDraft("category", event.target.value)}
              placeholder="Bakery, Minuman, Sembako"
              required
              value={draft.category}
            />
          </Field>
          <Field label="SKU">
            <input
              className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm uppercase outline-none focus:border-teal-600"
              onChange={(event) => updateDraft("sku", event.target.value.toUpperCase())}
              placeholder="PRD-001"
              required
              value={draft.sku}
            />
          </Field>
          <Field label="Barcode">
            <input
              className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600"
              inputMode="numeric"
              onChange={(event) => updateDraft("barcode", event.target.value)}
              placeholder="899000000001"
              required
              value={draft.barcode}
            />
          </Field>
          <Field label="Harga beli">
            <input
              className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600"
              inputMode="numeric"
              onChange={(event) => updateDraft("purchasePrice", event.target.value)}
              placeholder="12000"
              value={draft.purchasePrice}
            />
          </Field>
          <Field label="Harga jual">
            <input
              className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600"
              inputMode="numeric"
              onChange={(event) => updateDraft("sellingPrice", event.target.value)}
              placeholder="18000"
              required
              value={draft.sellingPrice}
            />
          </Field>
          <Field label="Stok saat ini">
            <input
              className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600"
              inputMode="numeric"
              onChange={(event) => updateDraft("stock", event.target.value)}
              placeholder="25"
              value={draft.stock}
            />
          </Field>
          <Field label="Batas minimum stok">
            <input
              className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600"
              inputMode="numeric"
              onChange={(event) => updateDraft("minStock", event.target.value)}
              placeholder="10"
              value={draft.minStock}
            />
          </Field>
        </div>

        {message ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
            {message}
          </div>
        ) : null}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-rose-200 px-4 text-sm font-bold text-rose-700 disabled:border-slate-200 disabled:text-slate-400"
            disabled={!canDelete}
            onClick={onDelete}
            type="button"
          >
            <Trash2 size={17} />
            Hapus Produk
          </button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              className="h-11 flex-1 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 sm:flex-none"
              onClick={onClose}
              type="button"
            >
              Batal
            </button>
            <button
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white sm:flex-none"
              type="submit"
            >
              <PackagePlus size={17} />
              Simpan Produk
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export function InventoryMovementModal({
  draft,
  message,
  onChange,
  onClose,
  onSubmit,
  products,
}: {
  draft: InventoryDraft;
  message: string;
  onChange: (draft: InventoryDraft) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  products: Product[];
}) {
  const selectedProduct = products.find((product) => product.id === draft.productId);

  function updateDraft(field: keyof InventoryDraft, value: string) {
    onChange({ ...draft, [field]: value });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-3 sm:p-4">
      <form
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white p-4 shadow-2xl sm:p-5"
        onSubmit={onSubmit}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
              Mutasi Stok
            </p>
            <h2 className="mt-1 text-xl font-bold">Catat Perubahan Stok</h2>
            <p className="mt-1 text-sm text-slate-500">
              Mutasi stok ini akan tercatat ke dalam riwayat inventaris toko.
            </p>
          </div>
          <button
            aria-label="Tutup form mutasi"
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-200"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          <Field label="Produk">
            <select
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-600"
              onChange={(event) => updateDraft("productId", event.target.value)}
              required
              value={draft.productId}
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - Stok: {product.stock}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Jenis Mutasi">
              <select
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-600"
                onChange={(event) => updateDraft("type", event.target.value)}
                value={draft.type}
              >
                <option value="Stock In">Stok Masuk</option>
                <option value="Stock Out">Stok Keluar</option>
                <option value="Adjustment">Penyesuaian Stok</option>
              </select>
            </Field>
            <Field label={draft.type === "Adjustment" ? "Jumlah penyesuaian" : "Jumlah"}>
              <input
                className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600"
                inputMode="numeric"
                onChange={(event) => updateDraft("quantity", event.target.value)}
                placeholder={draft.type === "Adjustment" ? "Contoh: -2 atau 8" : "Contoh: 12"}
                required
                value={draft.quantity}
              />
            </Field>
          </div>
          <Field label="Alasan / Catatan">
            <textarea
              className="min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-600"
              onChange={(event) => updateDraft("note", event.target.value)}
              placeholder="Contoh: Pengiriman dari pemasok, barang rusak, koreksi opname stok"
              value={draft.note}
            />
          </Field>
        </div>

        {selectedProduct ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Stok saat ini untuk <span className="font-semibold text-slate-950">{selectedProduct.name}</span>:{" "}
            <span className="font-semibold text-slate-950">{selectedProduct.stock}</span> unit.
          </div>
        ) : null}

        {message ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
            {message}
          </div>
        ) : null}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            className="h-11 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700"
            onClick={onClose}
            type="button"
          >
            Batal
          </button>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white"
            type="submit"
          >
            <ArrowDownUp size={17} />
            Simpan Mutasi
          </button>
        </div>
      </form>
    </div>
  );
}
