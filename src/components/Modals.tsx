import { X, Printer, PackagePlus, ArrowDownUp, Trash2 } from "lucide-react";
import type { FormEvent } from "react";
import type { Receipt, ProductDraft, InventoryDraft, Product } from "../types";
import { formatCurrency } from "../utils";
import { TotalRow, Field } from "./UI";

export function ReceiptModal({ onClose, receipt }: { onClose: () => void; receipt: Receipt }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Payment successful</p>
            <h2 className="mt-1 text-xl font-bold">Receipt {receipt.id}</h2>
            <p className="mt-1 text-sm text-slate-500">{receipt.date}</p>
          </div>
          <button
            aria-label="Close receipt"
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
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500">
            <div>
              <p className="font-semibold text-slate-700">Cashier</p>
              <p>{receipt.cashier}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-700">Payment</p>
              <p>{receipt.method}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          {receipt.lines.map((line) => (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2" key={line.id}>
              <div>
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
          <TotalRow label="Discount" value={`-${formatCurrency(receipt.discount)}`} />
          <TotalRow label="Tax" value={formatCurrency(receipt.tax)} />
          <div className="flex items-center justify-between pt-2 text-lg font-bold">
            <span>Total paid</span>
            <span>{formatCurrency(receipt.total)}</span>
          </div>
        </div>

        <button
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 text-sm font-bold text-white"
          onClick={onClose}
          type="button"
        >
          <Printer size={17} />
          Receipt printed
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4">
      <form
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-5 shadow-2xl"
        onSubmit={onSubmit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
              Product management
            </p>
            <h2 className="mt-1 text-xl font-bold">{isEditing ? "Edit product" : "New product"}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Tenant-scoped product record with category, SKU, barcode, price, and stock controls.
            </p>
          </div>
          <button
            aria-label="Close product editor"
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-200"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Product name">
            <input
              className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600"
              onChange={(event) => updateDraft("name", event.target.value)}
              placeholder="Example: Arabica Beans 250g"
              required
              value={draft.name}
            />
          </Field>
          <Field label="Category">
            <input
              className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600"
              onChange={(event) => updateDraft("category", event.target.value)}
              placeholder="Bakery, Beverage, Staple"
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
          <Field label="Purchase price">
            <input
              className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600"
              inputMode="numeric"
              onChange={(event) => updateDraft("purchasePrice", event.target.value)}
              placeholder="12000"
              value={draft.purchasePrice}
            />
          </Field>
          <Field label="Selling price">
            <input
              className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600"
              inputMode="numeric"
              onChange={(event) => updateDraft("sellingPrice", event.target.value)}
              placeholder="18000"
              required
              value={draft.sellingPrice}
            />
          </Field>
          <Field label="Inventory stock">
            <input
              className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600"
              inputMode="numeric"
              onChange={(event) => updateDraft("stock", event.target.value)}
              placeholder="25"
              value={draft.stock}
            />
          </Field>
          <Field label="Minimum stock">
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
            Delete product
          </button>
          <div className="flex gap-2">
            <button
              className="h-11 flex-1 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 sm:flex-none"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white sm:flex-none"
              type="submit"
            >
              <PackagePlus size={17} />
              Save product
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4">
      <form
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white p-5 shadow-2xl"
        onSubmit={onSubmit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
              Inventory movement
            </p>
            <h2 className="mt-1 text-xl font-bold">Record stock change</h2>
            <p className="mt-1 text-sm text-slate-500">
              Stock movement is scoped to this tenant and appears in inventory history.
            </p>
          </div>
          <button
            aria-label="Close inventory movement"
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-200"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          <Field label="Product">
            <select
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-600"
              onChange={(event) => updateDraft("productId", event.target.value)}
              required
              value={draft.productId}
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - {product.stock} stock
                </option>
              ))}
            </select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Movement type">
              <select
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-600"
                onChange={(event) => updateDraft("type", event.target.value)}
                value={draft.type}
              >
                <option>Stock In</option>
                <option>Stock Out</option>
                <option>Adjustment</option>
              </select>
            </Field>
            <Field label={draft.type === "Adjustment" ? "Adjustment quantity" : "Quantity"}>
              <input
                className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600"
                inputMode="numeric"
                onChange={(event) => updateDraft("quantity", event.target.value)}
                placeholder={draft.type === "Adjustment" ? "Example: -2 or 8" : "Example: 12"}
                required
                value={draft.quantity}
              />
            </Field>
          </div>
          <Field label="Reason">
            <textarea
              className="min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-600"
              onChange={(event) => updateDraft("note", event.target.value)}
              placeholder="Supplier delivery, damaged goods, stock opname correction"
              value={draft.note}
            />
          </Field>
        </div>

        {selectedProduct ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Current stock for <span className="font-semibold text-slate-950">{selectedProduct.name}</span>:{" "}
            <span className="font-semibold text-slate-950">{selectedProduct.stock}</span> units.
          </div>
        ) : null}

        {message ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
            {message}
          </div>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <button
            className="h-11 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white"
            type="submit"
          >
            <ArrowDownUp size={17} />
            Save movement
          </button>
        </div>
      </form>
    </div>
  );
}
