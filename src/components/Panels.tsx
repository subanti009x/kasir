import {
  BarChart3,
  ArrowDownUp,
  ReceiptText,
  Printer,
  History,
  Bell,
  UserRoundCog,
  Database,
} from "lucide-react";
import type { Period, Product, InventoryLog, Transaction, Role } from "../types";
import { formatCurrency } from "../utils";
import { Panel, SectionHeader, StatusBadge, DataRow, TotalRow, methodIcon, Permission } from "./UI";
import { periods, architectureItems } from "../data";

export function ReportsPanel({
  bestSeller,
  period,
  setPeriod,
  soldToday,
}: {
  bestSeller: string;
  period: Period;
  setPeriod: (period: Period) => void;
  soldToday: number;
}) {
  return (
    <Panel>
      <div className="flex items-center justify-between gap-3">
        <SectionHeader icon={BarChart3} title="Laporan Penjualan" subtitle="Filter laporan berdasarkan harian, mingguan, bulanan, tahunan, atau periode kustom." />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {periods.map((item) => (
          <button
            className={`h-9 rounded-lg px-3 text-sm font-semibold ${
              period === item ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600"
            }`}
            key={item}
            onClick={() => setPeriod(item)}
            type="button"
          >
            {item === "Daily" ? "Harian" : item === "Weekly" ? "Mingguan" : item === "Monthly" ? "Bulanan" : item === "Yearly" ? "Tahunan" : "Kustom"}
          </button>
        ))}
      </div>
      {period === "Custom" ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input className="h-10 rounded-lg border border-slate-200 px-3 text-sm" type="date" defaultValue="2026-07-01" />
          <input className="h-10 rounded-lg border border-slate-200 px-3 text-sm" type="date" defaultValue="2026-07-04" />
        </div>
      ) : null}
      <div className="mt-5 h-48 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="grid h-full grid-cols-12 items-end gap-2">
          {[44, 62, 38, 71, 58, 83, 69, 92, 74, 86, 66, 78].map((height, index) => (
            <div className="flex h-full flex-col justify-end" key={`${period}-${index}`}>
              <div className="w-full rounded-t-md bg-teal-600" style={{ height: `${Math.round(height * 1.55)}px` }} />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        <span className="font-semibold">Produk terlaris:</span> {bestSeller} dengan {soldToday} unit terjual hari ini.
      </div>
    </Panel>
  );
}

export function InventoryPanel({
  canManage,
  logs,
  onAdjust,
  products,
}: {
  canManage: boolean;
  logs: InventoryLog[];
  onAdjust: (product?: Product) => void;
  products: Product[];
}) {
  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeader icon={ArrowDownUp} title="Kontrol Stok (Inventaris)" subtitle="Pantau stok masuk, stok keluar, penyesuaian stok, dan riwayat mutasi." />
        <button
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-700 disabled:text-slate-400"
          disabled={!canManage}
          onClick={() => onAdjust()}
          type="button"
        >
          <ArrowDownUp size={15} />
          Catat Mutasi Stok
        </button>
      </div>
      <div className="mt-4 grid gap-3">
        {products.map((product) => {
          const stockRatio = Math.min((product.stock / Math.max(product.minStock * 2, 1)) * 100, 100);
          return (
            <div className="rounded-lg border border-slate-200 p-3" key={product.id}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{product.name}</p>
                  <p className="text-xs text-slate-500">Stok minimum: {product.minStock} unit</p>
                </div>
                <StatusBadge tone={product.stock <= product.minStock ? "rose" : "emerald"}>Stok: {product.stock}</StatusBadge>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-100">
                <div className={`h-2 rounded-full ${product.stock <= product.minStock ? "bg-rose-500" : "bg-emerald-500"}`} style={{ width: `${stockRatio}%` }} />
              </div>
              <button
                className="mt-3 h-9 w-full rounded-md border border-slate-200 text-xs font-bold text-slate-700 disabled:text-slate-400"
                disabled={!canManage}
                onClick={() => onAdjust(product)}
                type="button"
              >
                Sesuaikan stok {product.name}
              </button>
            </div>
          );
        })}
      </div>
      <div className="mt-4 grid gap-2">
        {logs.slice(0, 6).map((log, index) => (
          <DataRow
            key={`${log.product}-${log.type}-${log.note}-${index}`}
            label={log.product}
            meta={`${log.type === "Stock In" ? "Stok Masuk" : log.type === "Stock Out" ? "Stok Keluar" : "Penyesuaian"} - ${log.note}`}
            value={`${log.quantity > 0 ? "+" : ""}${log.quantity}`}
          />
        ))}
      </div>
    </Panel>
  );
}

export function CheckoutPanel({
  cartLines,
  discount,
  onCheckout,
  paymentMethod,
  paymentMethods,
  setPaymentMethod,
  subtotal,
  tax,
  taxRate,
  total,
}: {
  cartLines: (Product & { quantity: number; subtotal: number })[];
  discount: number;
  onCheckout: () => void;
  paymentMethod: string;
  paymentMethods: string[];
  setPaymentMethod: (method: string) => void;
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
}) {
  return (
    <Panel>
      <SectionHeader icon={ReceiptText} title="Keranjang Belanja" subtitle="Atur diskon, pajak, opsi split payment, dan pratinjau struk." />
      <div className="mt-4 grid gap-3">
        {cartLines.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            Pilih produk untuk memulai transaksi.
          </div>
        ) : (
          cartLines.map((line) => (
            <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3" key={line.id}>
              <div>
                <p className="text-sm font-semibold">{line.name}</p>
                <p className="text-xs text-slate-500">
                  {line.quantity} x {formatCurrency(line.sellingPrice)}
                </p>
              </div>
              <p className="text-sm font-bold">{formatCurrency(line.subtotal)}</p>
            </div>
          ))
        )}
      </div>
      <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm">
        <TotalRow label="Subtotal" value={formatCurrency(subtotal)} />
        <TotalRow label="Diskon" value={`-${formatCurrency(discount)}`} />
        <TotalRow label={`Pajak ${taxRate}%`} value={formatCurrency(tax)} />
        <div className="flex items-center justify-between pt-2 text-lg font-bold">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {paymentMethods.map((method) => (
          <button
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg border text-sm font-semibold ${
              paymentMethod === method ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700"
            }`}
            key={method}
            onClick={() => setPaymentMethod(method)}
            type="button"
          >
            {methodIcon(method)}
            {method}
          </button>
        ))}
      </div>
      <button
        className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-teal-700 text-sm font-bold text-white shadow-sm disabled:bg-slate-300"
        disabled={cartLines.length === 0}
        onClick={onCheckout}
        type="button"
      >
        <Printer size={18} />
        Bayar & Cetak Struk
      </button>
    </Panel>
  );
}

export function TransactionsPanel({ transactions }: { transactions: Transaction[] }) {
  return (
    <Panel>
      <SectionHeader icon={History} title="Transaksi Terbaru" subtitle="Daftar transaksi khusus toko Anda." />
      <div className="mt-4 grid gap-3">
        {transactions.map((transaction) => (
          <div className="rounded-lg border border-slate-200 p-3" key={transaction.id}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold">{transaction.id}</p>
              <StatusBadge tone={transaction.status === "Paid" ? "emerald" : "amber"}>
                {transaction.status === "Paid" ? "Lunas" : "Tertunda"}
              </StatusBadge>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-500">{transaction.customer}</span>
              <span className="font-semibold">{formatCurrency(transaction.total)}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {transaction.cashier} - {transaction.method} - {transaction.time}
            </p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function NotificationsPanel({
  notifications,
}: {
  notifications: { label: string; value: string; tone: string }[];
}) {
  return (
    <Panel>
      <SectionHeader icon={Bell} title="Pemberitahuan" subtitle="Peringatan operasional toko dan status pembayaran." />
      <div className="mt-4 grid gap-2">
        {notifications.map((item) => (
          <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-3" key={item.label}>
            <div className={`mt-1 size-2 rounded-full ${item.tone === "rose" ? "bg-rose-500" : item.tone === "emerald" ? "bg-emerald-500" : "bg-sky-500"}`} />
            <div>
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="text-xs leading-5 text-slate-500">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function PermissionsPanel({ role }: { role: Role }) {
  return (
    <Panel>
      <div className="flex items-center gap-2 text-sm font-bold">
        <UserRoundCog size={18} />
        Hak Akses Peran
      </div>
      <div className="mt-3 grid gap-2 text-sm text-slate-600">
        <Permission enabled={role !== "Cashier"} label="Mengelola produk dan kategori" />
        <Permission enabled={role !== "Cashier"} label="Melihat laporan laba rugi dan pengadaan" />
        <Permission enabled label="Memproses transaksi kasir" />
        <Permission enabled={role === "Super Admin"} label="Mengaktifkan atau menonaktifkan akun UMKM" />
      </div>
    </Panel>
  );
}

export function ArchitecturePanel() {
  return (
    <Panel>
      <SectionHeader icon={Database} title="Kesiapan Arsitektur Aplikasi" subtitle="Sistem siap untuk integrasi backend, database, cache, pencarian, sinkronisasi real-time, antrean tugas, dan monitoring." />
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {architectureItems.map((item) => (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={item.label}>
            <p className="text-sm font-bold">{item.label}</p>
            <p className="mt-2 text-sm leading-5 text-slate-600">{item.value}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}
