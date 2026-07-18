"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { productApi, settingsApi, transactionApi, customerApi } from "@/lib/api";
import { printReceipt } from "@/lib/printReceipt";
import { useFeatures } from "@/lib/useFeatures";
import { Search, Minus, Plus, Trash2, ShoppingCart, Printer, QrCode, Banknote, CreditCard, Wallet, Loader2, Check, SplitSquareHorizontal, ScanLine, X, MessageCircle, Percent, Tag } from "lucide-react";

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

// Barcode scanner timing constants
const SCANNER_THRESHOLD_MS = 50; // max ms between keystrokes from a HID scanner
const MIN_BARCODE_LENGTH = 4;    // minimum characters to consider as a barcode

export default function POSPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { hasFeature } = useFeatures();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [splitPayment, setSplitPayment] = useState(false);
  const [cashAmount, setCashAmount] = useState("");
  const [secondaryMethod, setSecondaryMethod] = useState("QRIS");
  const [secondaryAmount, setSecondaryAmount] = useState("");
  const [receipt, setReceipt] = useState<any>(null);
  const [scanFeedback, setScanFeedback] = useState<{ message: string; type: "success" | "error" | "warn" } | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [simulatorBarcode, setSimulatorBarcode] = useState("");
  const [scannerStatus, setScannerStatus] = useState<"disconnected" | "verifying" | "ready" | "lost">("disconnected");
  const [setupOpen, setSetupOpen] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);

  // ── Exclusive feature: PAYMENT_SYSTEM (discount) ──
  const [discountValue, setDiscountValue] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");

  // ── Exclusive feature: RECEIPT_OPTIONS / WHATSAPP_RECEIPT ──
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  // Barcode scanner refs
  const barcodeBuffer = useRef("");
  const lastKeyTime = useRef(0);
  const scannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const verifyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", search],
    queryFn: () => productApi.list(token!, search || undefined),
    enabled: !!token,
  });

  // Separate query that always fetches ALL products for barcode lookup (no search filter)
  const { data: allProducts = [] } = useQuery({
    queryKey: ["products-all"],
    queryFn: () => productApi.list(token!),
    enabled: !!token,
    staleTime: 30_000,
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

  // Customer list for WhatsApp receipt
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => customerApi.list(token!),
    enabled: !!token && (hasFeature("RECEIPT_OPTIONS") || hasFeature("WHATSAPP_RECEIPT")),
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

  // Show a temporary scan feedback toast
  const showFeedback = useCallback((message: string, type: "success" | "error" | "warn") => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setScanFeedback({ message, type });
    feedbackTimer.current = setTimeout(() => setScanFeedback(null), 2500);
  }, []);

  // Process a completed barcode scan
  const handleBarcodeScanned = useCallback(
    (barcode: string) => {
      const trimmed = barcode.trim();
      if (trimmed.length < MIN_BARCODE_LENGTH) return;

      // Exact match on barcode field first, then fallback to SKU
      const product = (allProducts as any[]).find(
        (p) => p.barcode === trimmed || p.sku === trimmed
      );

      if (!product) {
        showFeedback(`Produk tidak ditemukan: "${trimmed}"`, "error");
        return;
      }
      if (product.stock <= 0) {
        showFeedback(`Stok habis: ${product.name}`, "warn");
        return;
      }

      addToCart(product);
      showFeedback(`✓ ${product.name} ditambahkan ke keranjang`, "success");
    },
    [allProducts, showFeedback]
  );

  // Global keydown listener — detects HID barcode scanner (very fast keystrokes + Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      const timeDiff = now - lastKeyTime.current;
      const activeEl = document.activeElement as HTMLElement | null;
      const isInInput =
        activeEl &&
        (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA") &&
        activeEl.id !== "pos-search";

      // If cursor is in an unrelated input, ignore completely
      if (isInInput) return;

      if (e.key === "Enter") {
        if (barcodeBuffer.current.length >= MIN_BARCODE_LENGTH) {
          e.preventDefault();
          const captured = barcodeBuffer.current;
          barcodeBuffer.current = "";
          setScannerActive(false);
          setScannerStatus("ready");
          setScanCount((c) => c + 1);
          setLastScanTime(new Date());
          handleBarcodeScanned(captured);
        }
        return;
      }

      // Printable character
      if (e.key.length === 1) {
        if (barcodeBuffer.current.length === 0 || timeDiff < SCANNER_THRESHOLD_MS) {
          barcodeBuffer.current += e.key;
          lastKeyTime.current = now;
          setScannerActive(true);

          // Auto-reset buffer if no more keystrokes come in 300ms
          if (scannerTimer.current) clearTimeout(scannerTimer.current);
          scannerTimer.current = setTimeout(() => {
            barcodeBuffer.current = "";
            setScannerActive(false);
          }, 300);
        } else {
          // Too slow for scanner — must be manual keyboard, reset
          barcodeBuffer.current = e.key;
          lastKeyTime.current = now;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (scannerTimer.current) clearTimeout(scannerTimer.current);
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (verifyTimer.current) clearTimeout(verifyTimer.current);
    };
  }, [handleBarcodeScanned]);

  // Idle timeout — if no scanner activity for 5 min after being ready, mark as possibly disconnected
  useEffect(() => {
    if (scannerStatus !== "ready") return;
    idleTimer.current = setTimeout(() => {
      setScannerStatus("lost");
    }, 5 * 60 * 1000);
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [scannerStatus, scanCount]);

  // Warning toast when scanner connection appears lost
  useEffect(() => {
    if (scannerStatus === "lost") {
      showFeedback("Scanner mungkin terputus — tidak ada aktivitas scan selama 5 menit", "warn");
    }
  }, [scannerStatus, showFeedback]);

  // Verify timeout — if scanner not detected within 15s during test, show error
  useEffect(() => {
    if (scannerStatus !== "verifying") return;
    verifyTimer.current = setTimeout(() => {
      setScannerStatus("disconnected");
      showFeedback("Scanner tidak terdeteksi — pastikan scanner sudah terhubung dan coba lagi", "error");
    }, 15_000);
    return () => {
      if (verifyTimer.current) clearTimeout(verifyTimer.current);
    };
  }, [scannerStatus, showFeedback]);

  function startVerification() {
    setScannerStatus("verifying");
    showFeedback("Silakan scan barcode apa saja untuk menguji scanner...", "warn");
  }

  // Handle Enter key pressed while focus is inside the POS search box
  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter" || !search.trim()) return;
    handleBarcodeScanned(search.trim());
    setSearch("");
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

  // ── Exclusive feature: PAYMENT_SYSTEM — discount calculation ──
  const discountNum = Number(discountValue || 0);
  const discountAmount = hasFeature("PAYMENT_SYSTEM")
    ? discountType === "PERCENTAGE"
      ? subtotal * (discountNum / 100)
      : discountNum
    : 0;
  const afterDiscount = Math.max(subtotal - discountAmount, 0);

  const taxRate = Number(settings?.taxRate || 0);
  const tax = afterDiscount * (taxRate / 100);
  const total = afterDiscount + tax;
  const primaryAmount = Number(cashAmount || 0);
  const remainingAmount = Math.max(total - primaryAmount, 0);
  const secondAmount = splitPayment ? Number(secondaryAmount || remainingAmount) : 0;
  const paidAmount = splitPayment ? primaryAmount + secondAmount : primaryAmount;
  const changeDue = Math.max(paidAmount - total, 0);

  // ── Build WhatsApp receipt message ──
  function buildWhatsAppMessage(receiptData: any): string {
    const lines: string[] = [
      `🧾 *Struk Pembayaran*`,
      `No: ${receiptData.receiptId}`,
      `Tanggal: ${new Date(receiptData.createdAt).toLocaleString("id-ID")}`,
      ``,
      `--- Item ---`,
    ];
    receiptData.items?.forEach((item: any) => {
      lines.push(`${item.product?.name} x${item.quantity} = ${formatCurrency(item.subtotal)}`);
    });
    lines.push(``);
    lines.push(`Subtotal: ${formatCurrency(receiptData.subtotal)}`);
    if (receiptData.discount > 0) lines.push(`Diskon: -${formatCurrency(receiptData.discount)}`);
    lines.push(`Pajak: ${formatCurrency(receiptData.tax)}`);
    lines.push(`*TOTAL: ${formatCurrency(receiptData.total)}*`);
    lines.push(``);
    lines.push(`Dibayar: ${formatCurrency(receiptData.amountPaid)}`);
    lines.push(`Kembalian: ${formatCurrency(receiptData.changeDue)}`);
    lines.push(`Metode: ${receiptData.paymentMethod}`);
    lines.push(``);
    lines.push(`Terima kasih telah melakukan pembayaran dan mempercayai layanan Aderos. 🙏`);
    return lines.join("\n");
  }

  function sendWhatsAppReceipt(receiptData: any) {
    const customer = customers.find((c: any) => c.id === (receiptData.customerId || selectedCustomerId));
    if (!customer?.phone) return;
    const phone = customer.phone.replace(/[^0-9]/g, "").replace(/^0/, "62");
    const message = encodeURIComponent(buildWhatsAppMessage(receiptData));
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  }

  function handleCheckout() {
    if (cartItems.length === 0 || paidAmount < total) return;

    const base: any = {
      items: cartItems.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
      paymentMethod,
      amountPaid: paidAmount,
      customerId: selectedCustomerId || undefined,
    };

    // Include discount data if PAYMENT_SYSTEM is active
    if (hasFeature("PAYMENT_SYSTEM") && discountAmount > 0) {
      base.discount = discountNum;
      base.discountType = discountType;
    }

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
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px] xl:gap-6">
      {/* Scan feedback toast */}
      {scanFeedback && (
        <div
          className={`fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl px-5 py-3 text-sm font-semibold shadow-2xl transition-all ${
            scanFeedback.type === "success"
              ? "bg-emerald-600 text-white"
              : scanFeedback.type === "warn"
              ? "bg-amber-500 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          <ScanLine size={18} />
          {scanFeedback.message}
          <button onClick={() => setScanFeedback(null)} className="ml-1 opacity-70 hover:opacity-100">
            <X size={15} />
          </button>
        </div>
      )}

      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Scanner status badge + simulator toggle */}
          {/* Scanner status indicator */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Status badge */}
            <div
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${
                scannerActive
                  ? "border-teal-300 bg-teal-50 text-teal-700"
                  : scannerStatus === "ready"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : scannerStatus === "verifying"
                  ? "border-amber-300 bg-amber-50 text-amber-700"
                  : scannerStatus === "lost"
                  ? "border-rose-300 bg-rose-50 text-rose-700"
                  : "border-slate-200 bg-slate-50 text-slate-500"
              }`}
            >
              <span
                className={`inline-block size-2 rounded-full ${
                  scannerActive
                    ? "animate-pulse bg-teal-500"
                    : scannerStatus === "ready"
                    ? "bg-emerald-500"
                    : scannerStatus === "verifying"
                    ? "animate-pulse bg-amber-500"
                    : scannerStatus === "lost"
                    ? "animate-pulse bg-rose-500"
                    : "bg-slate-400"
                }`}
              />
              {scannerActive
                ? "Scanning..."
                : scannerStatus === "ready"
                ? "Scanner Ready"
                : scannerStatus === "verifying"
                ? "Menunggu scan..."
                : scannerStatus === "lost"
                ? "Koneksi Terputus"
                : "Scanner Belum Terdeteksi"}
            </div>

            {/* Action buttons */}
            {scannerStatus === "ready" ? (
              <button
                onClick={() => setSetupOpen((v) => !v)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                  setupOpen
                    ? "border-emerald-400 bg-emerald-600 text-white"
                    : "border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                <ScanLine size={13} />
                {setupOpen ? "Tutup Setup" : "Setup Scanner"}
              </button>
            ) : scannerStatus === "verifying" ? (
              <button
                onClick={() => setScannerStatus("disconnected")}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <X size={13} />
                Batal
              </button>
            ) : (
              <button
                onClick={startVerification}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <ScanLine size={13} />
                Test Scanner
              </button>
            )}

            {/* Simulator toggle */}
            <button
              onClick={() => setSimulatorOpen((v) => !v)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                simulatorOpen
                  ? "border-violet-300 bg-violet-50 text-violet-700"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
              }`}
            >
              <QrCode size={13} className={simulatorOpen ? "text-violet-500" : "text-slate-400"} />
              {simulatorOpen ? "Tutup Simulator" : "Simulator"}
            </button>
          </div>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              id="pos-search"
              className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
              placeholder="Cari produk, SKU, barcode — atau tekan Enter untuk scan"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
        </div>

        {/* ── Barcode Simulator Panel ── */}
        {simulatorOpen && (
          <div className="mb-4 rounded-xl border border-violet-200 bg-violet-50 p-4">
            <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-violet-700">
              <ScanLine size={13} />
              Simulator Barcode Scanner
              <span className="ml-auto font-normal normal-case text-violet-500">Fungsi identik dengan scanner fisik</span>
            </p>

            {/* Manual barcode input */}
            <div className="flex gap-2">
              <input
                id="simulator-input"
                type="text"
                className="h-10 flex-1 rounded-lg border border-violet-300 bg-white px-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10"
                placeholder="Ketik atau paste barcode di sini..."
                value={simulatorBarcode}
                onChange={(e) => setSimulatorBarcode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && simulatorBarcode.trim()) {
                    handleBarcodeScanned(simulatorBarcode.trim());
                    setSimulatorBarcode("");
                  }
                }}
              />
              <button
                className="flex h-10 items-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-40"
                disabled={!simulatorBarcode.trim()}
                onClick={() => {
                  handleBarcodeScanned(simulatorBarcode.trim());
                  setSimulatorBarcode("");
                }}
              >
                <ScanLine size={15} />
                Simulasi Scan
              </button>
            </div>

            {/* Quick-pick: all barcodes from products */}
            {(allProducts as any[]).filter((p) => p.barcode).length > 0 && (
              <div className="mt-3">
                <p className="mb-2 text-[11px] font-semibold text-violet-600">Klik barcode produk untuk scan cepat:</p>
                <div className="flex flex-wrap gap-2">
                  {(allProducts as any[])
                    .filter((p) => p.barcode)
                    .map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleBarcodeScanned(p.barcode)}
                        className="flex flex-col items-start rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-left transition hover:border-violet-400 hover:bg-violet-100"
                      >
                        <span className="font-mono text-xs font-bold text-slate-800">{p.barcode}</span>
                        <span className="max-w-[120px] truncate text-[10px] text-slate-500">{p.name}</span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Setup Scanner Panel ── */}
        {setupOpen && scannerStatus === "ready" && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/50 p-4">
            <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-700">
              <ScanLine size={13} />
              Setup Scanner
              <span className="ml-auto flex items-center gap-1.5 font-normal normal-case text-emerald-600">
                <span className="inline-block size-2 rounded-full bg-emerald-500" />
                Terhubung
              </span>
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* Stats */}
              <div className="rounded-lg border border-emerald-200 bg-white p-3">
                <p className="text-[11px] font-semibold text-emerald-600">Statistik Sesi</p>
                <div className="mt-2 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total scan</span>
                    <span className="font-bold text-slate-900">{scanCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Scan terakhir</span>
                    <span className="font-bold text-slate-900">
                      {lastScanTime ? lastScanTime.toLocaleTimeString("id-ID") : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status</span>
                    <span className="flex items-center gap-1.5 font-bold text-emerald-600">
                      <span className="inline-block size-2 rounded-full bg-emerald-500" /> Ready
                    </span>
                  </div>
                </div>
              </div>

              {/* Guide */}
              <div className="rounded-lg border border-emerald-200 bg-white p-3">
                <p className="text-[11px] font-semibold text-emerald-600">Panduan Penggunaan</p>
                <ul className="mt-2 space-y-1 text-xs text-slate-600">
                  <li className="flex items-start gap-1.5">
                    <Check size={12} className="mt-0.5 shrink-0 text-emerald-500" />
                    Arahkan scanner ke barcode produk
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check size={12} className="mt-0.5 shrink-0 text-emerald-500" />
                    Produk otomatis masuk ke keranjang
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check size={12} className="mt-0.5 shrink-0 text-emerald-500" />
                    Scan ulang produk sama untuk tambah qty
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check size={12} className="mt-0.5 shrink-0 text-emerald-500" />
                    Status berubah otomatis jika idle &gt; 5 menit
                  </li>
                </ul>
                <button
                  onClick={startVerification}
                  className="mt-3 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-300 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                  <ScanLine size={13} />
                  Test Ulang Scanner
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {products.map((product: any) => (
              <button
                key={product.id}
                className="group min-h-32 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-teal-300 hover:shadow-md disabled:opacity-50"
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
                <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
                  <p className="text-base font-bold text-slate-950 sm:text-lg">{formatCurrency(product.sellingPrice)}</p>
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
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5 xl:sticky xl:top-20">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-teal-700" />
            <h2 className="text-lg font-bold text-slate-950">Keranjang Belanja</h2>
            <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
              {cartItems.length} produk
            </span>
          </div>

          <div className="mt-4 max-h-[45vh] space-y-2 overflow-y-auto xl:max-h-[34vh]">
            {cartItems.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Pilih produk untuk dimasukkan ke keranjang</p>}
            {cartItems.map((item) => (
              <div key={item.product.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-100 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.product.name}</p>
                  <p className="text-xs text-slate-500">{formatCurrency(item.product.sellingPrice)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button className="grid size-9 place-items-center rounded-md border border-slate-200 hover:bg-slate-50" onClick={() => updateQty(item.product.id, -1)}>
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                  <button className="grid size-9 place-items-center rounded-md bg-slate-950 text-white hover:bg-slate-800" onClick={() => updateQty(item.product.id, 1)}>
                    <Plus size={14} />
                  </button>
                </div>
                <p className="ml-auto min-w-24 text-right text-sm font-bold">{formatCurrency(item.product.sellingPrice * item.quantity)}</p>
                <button className="grid size-9 place-items-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500" onClick={() => removeFromCart(item.product.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* ── Exclusive feature: PAYMENT_SYSTEM — Discount panel ── */}
          {hasFeature("PAYMENT_SYSTEM") && (
            <div className="mt-4 rounded-lg border border-violet-200 bg-violet-50/50 p-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-violet-700">
                <Tag size={13} />
                Diskon
              </p>
              <div className="flex gap-2">
                <select
                  className="h-9 rounded-lg border border-violet-200 bg-white px-2 text-xs font-semibold text-slate-700"
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as "PERCENTAGE" | "FIXED")}
                >
                  <option value="PERCENTAGE">Persen (%)</option>
                  <option value="FIXED">Nominal (Rp)</option>
                </select>
                <div className="relative flex-1">
                  <input
                    type="number"
                    min={0}
                    max={discountType === "PERCENTAGE" ? 100 : subtotal}
                    className="h-9 w-full rounded-lg border border-violet-200 bg-white px-3 pr-8 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10"
                    value={discountValue}
                    placeholder="0"
                    onChange={(e) => setDiscountValue(e.target.value)}
                  />
                  <Percent size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-400" />
                </div>
              </div>
              {discountAmount > 0 && (
                <p className="mt-2 text-xs font-semibold text-violet-700">
                  Potongan: -{formatCurrency(discountAmount)}
                </p>
              )}
            </div>
          )}

          {/* ── Exclusive feature: RECEIPT_OPTIONS — Customer selector ── */}
          {(hasFeature("RECEIPT_OPTIONS") || hasFeature("WHATSAPP_RECEIPT")) && (
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <MessageCircle size={13} />
                Pelanggan (Member)
              </p>
              <select
                className="h-9 w-full rounded-lg border border-emerald-200 bg-white px-3 text-sm outline-none"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
              >
                <option value="">— Tanpa member —</option>
                {customers.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}{c.phone ? ` (${c.phone})` : ""}</option>
                ))}
              </select>
            </div>
          )}

          <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm">
            <div className="flex justify-between text-slate-600"><span>Subtotal</span><span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span></div>
            {hasFeature("PAYMENT_SYSTEM") && discountAmount > 0 && (
              <div className="flex justify-between text-violet-600"><span>Diskon {discountType === "PERCENTAGE" ? `(${discountNum}%)` : ""}</span><span className="font-semibold">-{formatCurrency(discountAmount)}</span></div>
            )}
            <div className="flex justify-between text-slate-600"><span>Pajak ({taxRate}%)</span><span className="font-semibold text-slate-900">{formatCurrency(tax)}</span></div>
            <div className="flex justify-between pt-2 text-xl font-bold text-slate-950"><span>Total</span><span>{formatCurrency(total)}</span></div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-700"><SplitSquareHorizontal size={16} /> Split payment</span>
            <input type="checkbox" checked={splitPayment} onChange={(event) => setSplitPayment(event.target.checked)} />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {enabledPayments.map((method: any) => {
              const Icon = paymentIcons[method.name] || CreditCard;
              return (
                <button
                  key={method.id}
                  className={`flex h-11 items-center justify-center gap-2 rounded-lg border text-xs font-semibold transition ${paymentMethod === method.name ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
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
              <div className="grid gap-2 sm:grid-cols-[1fr_140px]">
                <select className="h-10 rounded-lg border border-slate-200 px-3 text-sm" value={secondaryMethod} onChange={(event) => setSecondaryMethod(event.target.value)}>
                  {enabledPayments.filter((method: any) => method.name !== paymentMethod).map((method: any) => <option key={method.id} value={method.name}>{method.name === "Cash" ? "Tunai" : method.name}</option>)}
                </select>
                <input type="number" min={0} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" value={secondaryAmount} placeholder={String(Math.ceil(remainingAmount))} onChange={(event) => setSecondaryAmount(event.target.value)} />
              </div>
            )}
            <div className="flex flex-col gap-1 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 sm:flex-row sm:justify-between">
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
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-3 sm:p-4" onClick={() => setReceipt(null)}>
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-4 shadow-2xl sm:p-6" onClick={(event) => event.stopPropagation()}>
            <div className="text-center">
              <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-emerald-100">
                <Check className="text-emerald-600" size={24} />
              </div>
              <h3 className="text-xl font-bold">Pembayaran Berhasil</h3>
              <p className="mt-1 text-sm text-slate-500">{receipt.receiptId}</p>
            </div>
            <div className="mt-4 space-y-2">
              {receipt.items?.map((item: any) => (
                <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
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
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
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
                Cetak Struk
              </button>
              {/* ── Exclusive feature: RECEIPT_OPTIONS + WHATSAPP_RECEIPT ── */}
              {hasFeature("WHATSAPP_RECEIPT") && (receipt.customerId || selectedCustomerId) && (
                <button
                  className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
                  onClick={() => sendWhatsAppReceipt(receipt)}
                >
                  <MessageCircle size={16} />
                  Kirim via WhatsApp
                </button>
              )}
              <button className="h-10 flex-1 rounded-lg bg-slate-950 text-sm font-bold text-white transition hover:bg-slate-800" onClick={() => { setReceipt(null); setDiscountValue(""); setSelectedCustomerId(""); }}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
