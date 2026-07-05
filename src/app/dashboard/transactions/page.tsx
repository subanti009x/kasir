"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { transactionApi } from "@/lib/api";
import { Search, Loader2, Eye, RotateCcw, X } from "lucide-react";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

export default function TransactionsPage() {
  const { token, canManage } = useAuth();
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

  const refundMut = useMutation({
    mutationFn: (id: string) => transactionApi.refund(token!, id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["transactions"] }); queryClient.invalidateQueries({ queryKey: ["dashboard"] }); setDetail(null); },
  });

  const transactions = data?.data || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">From</label>
          <input type="date" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">To</label>
          <input type="date" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} />
        </div>
        {(startDate || endDate) && (
          <button className="text-xs text-teal-700 hover:underline" onClick={() => { setStartDate(""); setEndDate(""); setPage(1); }}>Clear filters</button>
        )}
        <span className="ml-auto text-sm text-slate-500">{data?.total || 0} transactions</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
              <th className="px-4 py-3">Receipt</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Cashier</th><th className="px-4 py-3">Payment</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((tx: any) => (
                <tr key={tx.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{tx.receiptId}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(tx.createdAt).toLocaleString("id-ID")}</td>
                  <td className="px-4 py-3">{tx.cashier?.name || "—"}</td>
                  <td className="px-4 py-3"><span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold">{tx.paymentMethod}</span></td>
                  <td className="px-4 py-3 text-right font-bold">{formatCurrency(tx.total)}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tx.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" : tx.status === "REFUNDED" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{tx.status}</span></td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-slate-400 hover:text-teal-600" onClick={() => setDetail(tx)}><Eye size={15} /></button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">No transactions found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button className="h-8 rounded border px-3 text-xs disabled:opacity-30" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
          <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
          <button className="h-8 rounded border px-3 text-xs disabled:opacity-30" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setDetail(null)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h3 className="text-lg font-bold">{detail.receiptId}</h3><button onClick={() => setDetail(null)}><X size={20} /></button></div>
            <div className="mt-4 space-y-2">
              {detail.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.product?.name || "Product"} × {item.quantity}</span>
                  <span className="font-semibold">{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1 border-t pt-3 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(detail.subtotal)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(detail.tax)}</span></div>
              <div className="flex justify-between"><span>Discount</span><span>-{formatCurrency(detail.discount)}</span></div>
              <div className="flex justify-between text-lg font-bold"><span>Total</span><span>{formatCurrency(detail.total)}</span></div>
            </div>
            <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              <p>Payment: {detail.paymentMethod}</p>
              <p>Cashier: {detail.cashier?.name}</p>
              <p>Customer: {detail.customer?.name || "Walk-in"}</p>
              <p>Status: {detail.status}</p>
            </div>
            {canManage && detail.status === "COMPLETED" && (
              <button className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-rose-300 text-sm font-semibold text-rose-700 hover:bg-rose-50" onClick={() => { if (confirm("Refund this transaction?")) refundMut.mutate(detail.id); }}>
                <RotateCcw size={15} /> {refundMut.isPending ? "Processing..." : "Refund Transaction"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
