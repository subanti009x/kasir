"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { productApi, settingsApi, transactionApi } from "@/lib/api";
import { printReceipt } from "@/lib/printReceipt";
import { Search, Minus, Plus, Trash2, ShoppingCart, Printer, QrCode, Banknote, CreditCard, Wallet, Loader2, Check, SplitSquareHorizontal } from "lucide-react";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

type CartItem = { product: any; quantity: number };

const paymentIcons: Record<string, typeof Banknote> = {
  Cash: Banknote,
  QRIS: QrCode,
  "Bank Transfer": CreditCard,
  "E-Wallet": Wallet,
  "Split Payment": SplitSquareHorizontal,
};

export default function POSPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [splitPayment, setSplitPayment] = useState(false);
  const [cashAmount, setCashAmount] = useState("");
  const [secondaryMethod, setSecondaryMethod] = useState("QRIS");
  const [secondaryAmount, setSecondaryAmount] = useState("");
  const [receipt, setReceipt] = useState<any>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", search],
    queryFn: () => productApi.list(token!, search || undefined),
    enabled: !!token,
  });
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsApi.get(token!),
    enabled: !!token,
  });
  const { data: configuredPayments = [] } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: () => settingsApi.paymentMethods(token!),
    enabled: !!token,
  });

  const enabledPayments = useMemo(
    () => configuredPayments.filter((method: any) => method.enabled),
    [configuredPayments],
  );

  useEffect(() => {
    if (enabledPayments.length > 0 && !enabledPayments.some((method: any) => method.name === paymentMethod)) {
      setPaymentMethod(enabledPayments[0].name);
    }
    if (enabledPayments.length > 1 && !enabledPayments.some((method: any) => method.name === secondaryMethod)) {
      setSecondaryMethod(enabledPayments.find((method: any) => method.name !== paymentMethod)?.name || enabledPayments[0].name);
    }
  }, [enabledPayments, paymentMethod, secondaryMethod]);

  const checkoutMutation = useMutation({
    mutationFn: (data: any) => transactionApi.checkout(token!, data),
    onSuccess: (data) => {
      setReceipt(data);
      setCart(new Map());
      setCashAmount("");
      setSecondaryAmount("");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });

      // Auto-print the receipt to the connected thermal printer
      printReceipt(data, {
        name: settings?.name,
        address: settings?.address,
        phone: settings?.phone,
        logo: settings?.logo,
      });
    },
  });

  function addToCart(product: any) {
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(product.id);
      if (existing) {
        if (existing.quantity < product.stock) next.set(product.id, { ...existing, quantity: existing.quantity + 1 });
      } else if (product.stock > 0) {
        next.set(product.id, { product, quantity: 1 });
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
    setCart((prev) => {
      const next = new Map(prev);
      next.delete(productId);
      return next;
    });
  }

  const cartItems = Array.from(cart.values());
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
  const taxRate = Number(settings?.taxRate || 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;
  const primaryAmount = Number(cashAmount || 0);
  const remainingAmount = Math.max(total - primaryAmount, 0);
  const secondAmount = splitPayment ? Number(secondaryAmount || remainingAmount) : 0;
  const paidAmount = splitPayment ? primaryAmount + secondAmount : primaryAmount;
  const changeDue = Math.max(paidAmount - total, 0);

  function handleCheckout() {
    if (cartItems.length === 0 || paidAmount < total) return;

    const base = {
      items: cartItems.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
      paymentMethod,
      amountPaid: paidAmount,
    };

    checkoutMutation.mutate(
      splitPayment
        ? {
            ...base,
            payments: [
              { method: paymentMethod, amount: primaryAmount },
              { method: secondaryMethod, amount: secondAmount },
            ].filter((payment) => payment.amount > 0),
          }
        : base,
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
              placeholder="Cari nama produk, SKU, barcode..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {products.map((product: any) => (
              <button
                key={product.id}
                className="group rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-teal-300 hover:shadow-md disabled:opacity-50"
                onClick={() => addToCart(product)}
                disabled={product.stock === 0}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900 group-hover:text-teal-700">{product.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{product.sku}</p>
                  </div>
                  {product.image && <img src={product.image} alt="" className="size-10 rounded-md object-cover" />}
                </div>
                {product.category && (
                  <span className="mt-3 inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    {product.category.name}
                  </span>
                )}
                <div className="mt-3 flex items-end justify-between">
                  <p className="text-lg font-bold text-slate-950">{formatCurrency(product.sellingPrice)}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${product.stock <= (product.minStock || 0) ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
                    Stok: {product.stock}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-teal-700" />
            <h2 className="text-lg font-bold text-slate-950">Keranjang Belanja</h2>
            <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
              {cartItems.length} produk
            </span>
          </div>

          <div className="mt-4 max-h-[34vh] space-y-2 overflow-y-auto">
            {cartItems.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Pilih produk untuk dimasukkan ke keranjang</p>}
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

          <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm">
            <div className="flex justify-between text-slate-600"><span>Subtotal</span><span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between text-slate-600"><span>Pajak ({taxRate}%)</span><span className="font-semibold text-slate-900">{formatCurrency(tax)}</span></div>
            <div className="flex justify-between pt-2 text-xl font-bold text-slate-950"><span>Total</span><span>{formatCurrency(total)}</span></div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-700"><SplitSquareHorizontal size={16} /> Split payment</span>
            <input type="checkbox" checked={splitPayment} onChange={(event) => setSplitPayment(event.target.checked)} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {enabledPayments.map((method: any) => {
              const Icon = paymentIcons[method.name] || CreditCard;
              return (
                <button
                  key={method.id}
                  className={`flex h-10 items-center justify-center gap-2 rounded-lg border text-xs font-semibold transition ${paymentMethod === method.name ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                  onClick={() => setPaymentMethod(method.name)}
                >
                  <Icon size={15} /> {method.name === "Cash" ? "Tunai" : method.name}
                </button>
              );
            })}
          </div>

          <div className="mt-3 grid gap-3">
            <label className="text-xs font-medium text-slate-600">
              {splitPayment ? "Nominal utama" : paymentMethod === "Cash" ? "Nominal dibayar" : "Nominal pembayaran"}
              <input type="number" min={0} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={cashAmount} placeholder="0" onChange={(event) => setCashAmount(event.target.value)} />
            </label>
            {splitPayment && (
              <div className="grid grid-cols-[1fr_140px] gap-2">
                <select className="h-10 rounded-lg border border-slate-200 px-3 text-sm" value={secondaryMethod} onChange={(event) => setSecondaryMethod(event.target.value)}>
                  {enabledPayments.filter((method: any) => method.name !== paymentMethod).map((method: any) => <option key={method.id} value={method.name}>{method.name === "Cash" ? "Tunai" : method.name}</option>)}
                </select>
                <input type="number" min={0} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" value={secondaryAmount} placeholder={String(Math.ceil(remainingAmount))} onChange={(event) => setSecondaryAmount(event.target.value)} />
              </div>
            )}
            <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <span>Dibayar {formatCurrency(paidAmount)}</span>
              <span>Kembalian {formatCurrency(changeDue)}</span>
            </div>
          </div>

          <button
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-teal-700 text-sm font-bold text-white shadow-lg shadow-teal-700/20 transition hover:bg-teal-600 disabled:bg-slate-300 disabled:shadow-none"
            disabled={cartItems.length === 0 || paidAmount < total || enabledPayments.length === 0 || checkoutMutation.isPending}
            onClick={handleCheckout}
          >
            {checkoutMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Printer size={18} />}
            Bayar & Cetak Struk
          </button>

          {checkoutMutation.isError && <p className="mt-2 text-center text-xs text-red-600">{(checkoutMutation.error as any)?.message || "Proses pembayaran gagal"}</p>}
        </div>
      </div>

      {receipt && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setReceipt(null)}>
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="text-center">
              <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-emerald-100">
                <Check className="text-emerald-600" size={24} />
              </div>
              <h3 className="text-xl font-bold">Pembayaran Berhasil</h3>
              <p className="mt-1 text-sm text-slate-500">{receipt.receiptId}</p>
            </div>
            <div className="mt-4 space-y-2">
              {receipt.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.product?.name} x {item.quantity}</span>
                  <span className="font-semibold">{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1 border-t pt-3 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(receipt.subtotal)}</span></div>
              <div className="flex justify-between"><span>Pajak</span><span>{formatCurrency(receipt.tax)}</span></div>
              <div className="flex justify-between"><span>Dibayar</span><span>{formatCurrency(receipt.amountPaid)}</span></div>
              <div className="flex justify-between"><span>Kembalian</span><span>{formatCurrency(receipt.changeDue)}</span></div>
              <div className="flex justify-between text-lg font-bold"><span>Total</span><span>{formatCurrency(receipt.total)}</span></div>
            </div>
            <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              <p>Metode Pembayaran: {receipt.paymentMethod === "Cash" ? "Tunai" : receipt.paymentMethod}</p>
              {receipt.payments?.map((payment: any) => <p key={payment.id}>{payment.method === "Cash" ? "Tunai" : payment.method}: {formatCurrency(payment.amount)}</p>)}
              <p>Kasir: {receipt.cashier?.name}</p>
              <p>Tanggal: {new Date(receipt.createdAt).toLocaleString("id-ID")}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                onClick={() => printReceipt(receipt, {
                  name: settings?.name,
                  address: settings?.address,
                  phone: settings?.phone,
                  logo: settings?.logo,
                })}
              >
                <Printer size={16} />
                Cetak Ulang
              </button>
              <button className="h-10 flex-1 rounded-lg bg-slate-950 text-sm font-bold text-white transition hover:bg-slate-800" onClick={() => setReceipt(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
