"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { productApi, transactionApi } from "@/lib/api";
import { Search, Minus, Plus, Trash2, ShoppingCart, Printer, QrCode, Banknote, CreditCard, Wallet, Loader2, Check } from "lucide-react";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

type CartItem = { product: any; quantity: number };

export default function POSPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [receipt, setReceipt] = useState<any>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", search],
    queryFn: () => productApi.list(token!, search || undefined),
    enabled: !!token,
  });

  const checkoutMutation = useMutation({
    mutationFn: (data: any) => transactionApi.checkout(token!, data),
    onSuccess: (data) => {
      setReceipt(data);
      setCart(new Map());
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  function addToCart(product: any) {
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(product.id);
      if (existing) {
        if (existing.quantity < product.stock) {
          next.set(product.id, { ...existing, quantity: existing.quantity + 1 });
        }
      } else {
        if (product.stock > 0) {
          next.set(product.id, { product, quantity: 1 });
        }
      }
      return next;
    });
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) => {
      const next = new Map(prev);
      const item = next.get(productId);
      if (!item) return prev;
      const newQty = item.quantity + delta;
      if (newQty <= 0) next.delete(productId);
      else if (newQty <= item.product.stock) next.set(productId, { ...item, quantity: newQty });
      return next;
    });
  }

  function removeFromCart(productId: string) {
    setCart((prev) => { const next = new Map(prev); next.delete(productId); return next; });
  }

  const cartItems = Array.from(cart.values());
  const subtotal = cartItems.reduce((sum, i) => sum + i.product.sellingPrice * i.quantity, 0);
  const tax = subtotal * 0.11;
  const total = subtotal + tax;

  function handleCheckout() {
    if (cartItems.length === 0) return;
    checkoutMutation.mutate({
      items: cartItems.map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
        unitPrice: i.product.sellingPrice,
      })),
      paymentMethod,
    });
  }

  const paymentMethods = [
    { name: "Cash", icon: Banknote },
    { name: "QRIS", icon: QrCode },
    { name: "Bank Transfer", icon: CreditCard },
    { name: "E-Wallet", icon: Wallet },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
      {/* Product grid */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
              placeholder="Search products, SKU, barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {products.map((p: any) => (
              <button
                key={p.id}
                className="group rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-teal-300 hover:shadow-md disabled:opacity-50"
                onClick={() => addToCart(p)}
                disabled={p.stock === 0}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900 group-hover:text-teal-700">{p.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{p.sku}</p>
                  </div>
                  {p.category && (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {p.category.name}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <p className="text-lg font-bold text-slate-950">{formatCurrency(p.sellingPrice)}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${p.stock <= (p.minStock || 0) ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
                    {p.stock} stock
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cart */}
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-teal-700" />
            <h2 className="text-lg font-bold text-slate-950">Current Sale</h2>
            <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
              {cartItems.length} items
            </span>
          </div>

          <div className="mt-4 max-h-[40vh] space-y-2 overflow-y-auto">
            {cartItems.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400">Tap products to add to cart</p>
            )}
            {cartItems.map((item) => (
              <div key={item.product.id} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.product.name}</p>
                  <p className="text-xs text-slate-500">{formatCurrency(item.product.sellingPrice)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button className="grid size-7 place-items-center rounded-md border border-slate-200 hover:bg-slate-50" onClick={() => updateQty(item.product.id, -1)}>
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                  <button className="grid size-7 place-items-center rounded-md bg-slate-950 text-white hover:bg-slate-800" onClick={() => updateQty(item.product.id, 1)}>
                    <Plus size={14} />
                  </button>
                </div>
                <p className="w-20 text-right text-sm font-bold">{formatCurrency(item.product.sellingPrice * item.quantity)}</p>
                <button className="text-slate-400 hover:text-red-500" onClick={() => removeFromCart(item.product.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm">
            <div className="flex justify-between text-slate-600"><span>Subtotal</span><span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between text-slate-600"><span>Tax (11%)</span><span className="font-semibold text-slate-900">{formatCurrency(tax)}</span></div>
            <div className="flex justify-between pt-2 text-xl font-bold text-slate-950"><span>Total</span><span>{formatCurrency(total)}</span></div>
          </div>

          {/* Payment methods */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {paymentMethods.map((m) => (
              <button
                key={m.name}
                className={`flex h-10 items-center justify-center gap-2 rounded-lg border text-xs font-semibold transition ${
                  paymentMethod === m.name
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
                onClick={() => setPaymentMethod(m.name)}
              >
                <m.icon size={15} /> {m.name}
              </button>
            ))}
          </div>

          <button
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 text-sm font-bold text-white shadow-lg shadow-teal-700/20 transition hover:bg-teal-600 disabled:bg-slate-300 disabled:shadow-none"
            disabled={cartItems.length === 0 || checkoutMutation.isPending}
            onClick={handleCheckout}
          >
            {checkoutMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Printer size={18} />}
            Pay & Print Receipt
          </button>

          {checkoutMutation.isError && (
            <p className="mt-2 text-center text-xs text-red-600">{(checkoutMutation.error as any)?.message || "Checkout failed"}</p>
          )}
        </div>
      </div>

      {/* Receipt modal */}
      {receipt && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setReceipt(null)}>
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-emerald-100">
                <Check className="text-emerald-600" size={24} />
              </div>
              <h3 className="text-xl font-bold">Payment Successful</h3>
              <p className="mt-1 text-sm text-slate-500">{receipt.receiptId}</p>
            </div>
            <div className="mt-4 space-y-2">
              {receipt.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.product?.name} × {item.quantity}</span>
                  <span className="font-semibold">{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1 border-t pt-3 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(receipt.subtotal)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(receipt.tax)}</span></div>
              <div className="flex justify-between text-lg font-bold"><span>Total</span><span>{formatCurrency(receipt.total)}</span></div>
            </div>
            <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              <p>Payment: {receipt.paymentMethod}</p>
              <p>Cashier: {receipt.cashier?.name}</p>
              <p>Date: {new Date(receipt.createdAt).toLocaleString("id-ID")}</p>
            </div>
            <button className="mt-4 h-10 w-full rounded-lg bg-slate-950 text-sm font-bold text-white" onClick={() => setReceipt(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
