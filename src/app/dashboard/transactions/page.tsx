"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { transactionApi, settingsApi } from "@/lib/api";
import { printReceipt } from "@/lib/printReceipt";
import { Loader2, Eye, RotateCcw, X, Printer, MessageCircle, CheckCircle2, Clock, AlertCircle, Send } from "lucide-react";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

function WaStatusBadge({ logs }: { logs?: any[] }) {
  if (!logs || logs.length === 0) {
    return <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-400">— Tidak ada</span>;
  }
  const log = logs[0];
  switch (log.status) {
    case "SENT":
      return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700"><CheckCircle2 size={10} /> Terkirim</span>;
    case "SENDING":
      return <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700"><Send size={10} /> Mengirim</span>;
    case "PENDING":
      return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700"><Clock size={10} /> Menunggu</span>;
    case "FAILED":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700" title={log.errorMessage || "Gagal mengirim"}>
          <AlertCircle size={10} /> Gagal
        </span>
      );
    default:
      return <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-400">—</span>;
  }
}

export default function TransactionsPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [detail, setDetail] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["transactions", page, startDate, endDate],
    queryFn: () => transactionApi.list(token!, page, startDate || undefined, endDate || undefined),
    enabled: !!token,
  });

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsApi.get(token!),
    enabled: !!token,
  });

  const refundMut = useMutation({
    mutationFn: (id: string) => transactionApi.refund(token!, id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["transactions"] }); queryClient.invalidateQueries({ queryKey: ["dashboard"] }); setDetail(null); },
  });

  const transactions = data?.data || [];
  const totalPages = data?.totalPages || 1;

  const handlePrint = (tx: any) => {
    printReceipt(tx, {
      name: settings?.name,
      address: settings?.address,
      phone: settings?.phone,
      logo: settings?.logo,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <label className="text-xs text-slate-500">Dari</label>
          <input type="date" className="h-11 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm sm:h-10 sm:flex-none" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} />
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <label className="text-xs text-slate-500">Hingga</label>
          <input type="date" className="h-11 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm sm:h-10 sm:flex-none" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} />
        </div>
        {(startDate || endDate) && (
          <button className="text-xs text-teal-700 hover:underline" onClick={() => { setStartDate(""); setEndDate(""); setPage(1); }}>Hapus filter</button>
        )}
        <span className="text-sm text-slate-500 sm:ml-auto">{data?.total || 0} transaksi</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="responsive-table w-full text-sm">
            <thead><tr className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
              <th className="px-4 py-3">ID Struk</th><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Kasir</th><th className="px-4 py-3">Pembayaran</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-center">WA</th><th className="px-4 py-3 text-right">Aksi</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((tx: any) => (
                <tr key={tx.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{tx.receiptId}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(tx.createdAt).toLocaleString("id-ID")}</td>
                  <td className="px-4 py-3">{tx.cashier?.name || "—"}</td>
                  <td className="px-4 py-3"><span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold">{tx.paymentMethod === "Cash" ? "Tunai" : tx.paymentMethod}</span></td>
                  <td className="px-4 py-3 text-right font-bold">{formatCurrency(tx.total)}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tx.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" : tx.status === "REFUNDED" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{tx.status === "COMPLETED" ? "LUNAS" : tx.status === "REFUNDED" ? "DI-REFUND" : tx.status}</span></td>
                  <td className="px-4 py-3 text-center"><WaStatusBadge logs={tx.whatsappLogs} /></td>
                  <td className="px-4 py-3 text-right">
                    <button className="inline-grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-teal-50 hover:text-teal-600" onClick={() => setDetail(tx)}><Eye size={15} /></button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">Transaksi tidak ditemukan</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button className="h-10 rounded border px-3 text-xs disabled:opacity-30" disabled={page <= 1} onClick={() => setPage(page - 1)}>Sebelumnya</button>
          <span className="text-sm text-slate-600">Halaman {page} dari {totalPages}</span>
          <button className="h-10 rounded border px-3 text-xs disabled:opacity-30" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Selanjutnya</button>
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-3 sm:p-4" onClick={() => setDetail(null)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-4 shadow-2xl sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h3 className="text-lg font-bold">{detail.receiptId}</h3><button onClick={() => setDetail(null)}><X size={20} /></button></div>
            <div className="mt-4 space-y-2">
              {detail.items?.map((item: any) => (
                <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                  <span>{item.product?.name || "Produk"} × {item.quantity}</span>
                  <span className="font-semibold">{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1 border-t pt-3 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(detail.subtotal)}</span></div>
              <div className="flex justify-between"><span>Pajak</span><span>{formatCurrency(detail.tax)}</span></div>
              <div className="flex justify-between"><span>Diskon</span><span>-{formatCurrency(detail.discount)}</span></div>
              <div className="flex justify-between text-lg font-bold"><span>Total</span><span>{formatCurrency(detail.total)}</span></div>
            </div>
            <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              <p>Pembayaran: {detail.paymentMethod === "Cash" ? "Tunai" : detail.paymentMethod}</p>
              <p>Kasir: {detail.cashier?.name}</p>
              <p>Pelanggan: {detail.customer?.name || "Pelanggan Umum"}</p>
              <p>Status: {detail.status === "COMPLETED" ? "LUNAS" : detail.status === "REFUNDED" ? "DI-REFUND" : detail.status}</p>
            </div>

            {/* WhatsApp Notification Status */}
            {detail.whatsappLogs && detail.whatsappLogs.length > 0 && (
              <div className="mt-3 rounded-lg border border-slate-200 p-3">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <MessageCircle size={13} className="text-green-600" />
                  Status Notifikasi WhatsApp
                </div>
                <div className="space-y-1.5">
                  {detail.whatsappLogs.map((log: any) => (
                    <div key={log.id} className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        {log.event === "CHECKOUT_SUCCESS" ? "Struk Checkout" : log.event === "REFUND_SUCCESS" ? "Notif Refund" : log.event}
                        {log.recipientName && <span className="ml-1 text-slate-400">→ {log.recipientName}</span>}
                      </span>
                      <WaStatusBadge logs={[log]} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-teal-300 text-sm font-semibold text-teal-700 hover:bg-teal-50 transition-colors"
                onClick={() => handlePrint(detail)}
              >
                <Printer size={15} /> Cetak Struk
              </button>
              {detail.status === "COMPLETED" && (
                <button
                  className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-rose-300 text-sm font-semibold text-rose-700 hover:bg-rose-50 transition-colors"
                  onClick={() => { if (confirm("Refund transaksi ini?")) refundMut.mutate(detail.id); }}
                >
                  <RotateCcw size={15} /> {refundMut.isPending ? "Memproses..." : "Refund Transaksi"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
