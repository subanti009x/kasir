"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { accountingApi } from "@/lib/api";
import {
  Loader2, TrendingUp, TrendingDown, DollarSign, BarChart3, Receipt,
  Wallet, PiggyBank, Building2, Plus, Trash2, X, ArrowUpRight, ArrowDownRight,
  CircleDollarSign, Landmark, Scale,
} from "lucide-react";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

const EXPENSE_CATEGORIES = [
  { value: "RENT", label: "Sewa Tempat", icon: Building2, color: "bg-violet-100 text-violet-700" },
  { value: "UTILITIES", label: "Listrik & Air (Utilitas)", icon: Wallet, color: "bg-amber-100 text-amber-700" },
  { value: "SALARIES", label: "Gaji Karyawan", icon: DollarSign, color: "bg-sky-100 text-sky-700" },
  { value: "MARKETING", label: "Pemasaran / Iklan", icon: TrendingUp, color: "bg-pink-100 text-pink-700" },
  { value: "SUPPLIES", label: "Perlengkapan & Bahan", icon: Receipt, color: "bg-teal-100 text-teal-700" },
  { value: "OTHER", label: "Lainnya", icon: PiggyBank, color: "bg-slate-100 text-slate-700" },
];

type Tab = "profit-loss" | "balance-sheet" | "expenses";

export default function AccountingPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 8) + "01";

  const [tab, setTab] = useState<Tab>("profit-loss");
  const [plStart, setPlStart] = useState(monthStart);
  const [plEnd, setPlEnd] = useState(today);
  const [bsDate, setBsDate] = useState(today);
  const [expStart, setExpStart] = useState(monthStart);
  const [expEnd, setExpEnd] = useState(today);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ category: "OTHER", description: "", amount: "", date: today });

  // ── Queries ────────────────────────────────────────────
  const { data: pl, isLoading: plLoading } = useQuery({
    queryKey: ["profit-loss", plStart, plEnd],
    queryFn: () => accountingApi.profitLoss(token!, plStart, plEnd),
    enabled: !!token && tab === "profit-loss",
  });

  const { data: bs, isLoading: bsLoading } = useQuery({
    queryKey: ["balance-sheet", bsDate],
    queryFn: () => accountingApi.balanceSheet(token!, bsDate),
    enabled: !!token && tab === "balance-sheet",
  });

  const { data: expenses, isLoading: expLoading } = useQuery({
    queryKey: ["expenses", expStart, expEnd],
    queryFn: () => accountingApi.listExpenses(token!, expStart, expEnd),
    enabled: !!token && tab === "expenses",
  });

  const createExpense = useMutation({
    mutationFn: (data: { category: string; description: string; amount: number; date: string }) =>
      accountingApi.createExpense(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["profit-loss"] });
      queryClient.invalidateQueries({ queryKey: ["balance-sheet"] });
      setShowExpenseForm(false);
      setExpenseForm({ category: "OTHER", description: "", amount: "", date: today });
    },
  });

  const deleteExpense = useMutation({
    mutationFn: (id: string) => accountingApi.deleteExpense(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["profit-loss"] });
      queryClient.invalidateQueries({ queryKey: ["balance-sheet"] });
    },
  });

  const tabs: { key: Tab; label: string; icon: typeof BarChart3 }[] = [
    { key: "profit-loss", label: "Laba Rugi", icon: BarChart3 },
    { key: "balance-sheet", label: "Neraca Keuangan", icon: Scale },
    { key: "expenses", label: "Biaya Operasional", icon: Receipt },
  ];

  return (
    <div className="space-y-6">
      {/* ── Tab Bar ── */}
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              tab === t.key
                ? "bg-slate-950 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/* ── PROFIT & LOSS TAB ── */}
      {/* ══════════════════════════════════════════════════ */}
      {tab === "profit-loss" && (
        <>
          {/* Date filter */}
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center">
            <BarChart3 size={18} className="text-teal-700" />
            <span className="text-sm font-semibold text-slate-900">Laporan Laba Rugi</span>
            <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:items-center">
              <input type="date" className="h-11 rounded-lg border border-slate-200 px-3 text-sm sm:h-9" value={plStart} onChange={(e) => setPlStart(e.target.value)} />
              <span className="text-xs text-slate-400">sampai</span>
              <input type="date" className="h-11 rounded-lg border border-slate-200 px-3 text-sm sm:h-9" value={plEnd} onChange={(e) => setPlEnd(e.target.value)} />
            </div>
          </div>

          {plLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
          ) : pl ? (
            <>
              {/* Summary cards */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <PLCard icon={CircleDollarSign} iconBg="bg-teal-50 text-teal-700" label="Pendapatan Usaha" value={pl.revenue} />
                <PLCard icon={ArrowDownRight} iconBg="bg-orange-50 text-orange-700" label="Harga Pokok Penjualan (HPP)" value={-pl.cogs} negative />
                <PLCard icon={TrendingUp} iconBg="bg-emerald-50 text-emerald-700" label="Laba Kotor" value={pl.grossProfit} sub={`${pl.grossProfitMargin}% margin`} />
                <PLCard icon={Receipt} iconBg="bg-rose-50 text-rose-700" label="Beban Operasional" value={-pl.operatingExpenses?.total} negative />
                <PLCard
                  icon={pl.netProfit >= 0 ? TrendingUp : TrendingDown}
                  iconBg={pl.netProfit >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}
                  label="Laba Bersih"
                  value={pl.netProfit}
                  sub={`${pl.netProfitMargin}% margin`}
                  highlight
                />
              </div>

              {/* P&L visual breakdown */}
              <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
                {/* Revenue vs Expenses bar */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900">Analisis Pendapatan vs Beban</h3>
                  <div className="mt-5 space-y-4">
                    <ProgressBar label="Pendapatan" amount={pl.revenue} max={pl.revenue || 1} color="bg-teal-600" />
                    <ProgressBar label="HPP" amount={pl.cogs} max={pl.revenue || 1} color="bg-orange-500" />
                    <ProgressBar label="Beban Operasional" amount={pl.operatingExpenses?.total || 0} max={pl.revenue || 1} color="bg-rose-500" />
                    <div className="border-t border-slate-100 pt-3">
                      <ProgressBar label="Laba Bersih" amount={pl.netProfit} max={pl.revenue || 1} color={pl.netProfit >= 0 ? "bg-emerald-600" : "bg-red-500"} />
                    </div>
                  </div>
                </div>

                {/* Expense category breakdown */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900">Rincian Beban Operasional</h3>
                  <div className="mt-3 space-y-2">
                    {pl.operatingExpenses?.categories?.length === 0 && (
                      <p className="py-6 text-center text-xs text-slate-400">Tidak ada pengeluaran tercatat pada periode ini</p>
                    )}
                    {(pl.operatingExpenses?.categories || []).map((cat: any) => {
                      const meta = EXPENSE_CATEGORIES.find((c) => c.value === cat.category) || EXPENSE_CATEGORIES[5];
                      return (
                        <div key={cat.category} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3">
                          <div className={`grid size-9 shrink-0 place-items-center rounded-lg ${meta.color}`}>
                            <meta.icon size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-900">{meta.label}</p>
                            <p className="text-[10px] text-slate-400">{cat.count} transaksi</p>
                          </div>
                          <span className="text-xs font-bold text-slate-900">{formatCurrency(cat.amount)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* ── BALANCE SHEET TAB ── */}
      {/* ══════════════════════════════════════════════════ */}
      {tab === "balance-sheet" && (
        <>
          {/* Date filter */}
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center">
            <Landmark size={18} className="text-teal-700" />
            <span className="text-sm font-semibold text-slate-900">Neraca Keuangan</span>
            <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:items-center">
              <span className="text-xs text-slate-400">Per tanggal</span>
              <input type="date" className="h-11 rounded-lg border border-slate-200 px-3 text-sm sm:h-9" value={bsDate} onChange={(e) => setBsDate(e.target.value)} />
            </div>
          </div>

          {bsLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
          ) : bs ? (
            <>
              {/* Balance verification badge */}
              <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${
                bs.isBalanced
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}>
                <Scale size={16} />
                {bs.isBalanced
                  ? "✓ Seimbang (Balanced) — Aset = Liabilitas + Ekuitas"
                  : "⚠️ Belum Seimbang — Harap periksa pencatatan keuangan"}
              </div>

              {/* Three-column layout */}
              <div className="grid gap-4 lg:grid-cols-3">
                {/* Assets */}
                <BSSection
                  title="Aset (Aktiva)"
                  icon={<ArrowUpRight size={16} />}
                  color="teal"
                  items={[
                    { label: "Kas & Setara Kas", amount: bs.assets.cash },
                    { label: "Persediaan Barang (Stok)", amount: bs.assets.inventory },
                  ]}
                  total={bs.assets.total}
                />

                {/* Liabilities */}
                <BSSection
                  title="Kewajiban (Liabilitas)"
                  icon={<ArrowDownRight size={16} />}
                  color="rose"
                  items={[
                    { label: "Utang Usaha", amount: bs.liabilities.accountsPayable },
                  ]}
                  total={bs.liabilities.total}
                />

                {/* Equity */}
                <BSSection
                  title="Modal (Ekuitas)"
                  icon={<PiggyBank size={16} />}
                  color="indigo"
                  items={[
                    { label: "Laba Ditahan", amount: bs.equity.retainedEarnings },
                  ]}
                  total={bs.equity.total}
                />
              </div>

              {/* Summary row */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Aset</p>
                  <p className="mt-1 text-2xl font-bold text-slate-950">{formatCurrency(bs.assets.total)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Liabilitas + Ekuitas</p>
                  <p className="mt-1 text-2xl font-bold text-slate-950">{formatCurrency(bs.liabilities.total + bs.equity.total)}</p>
                </div>
              </div>
            </>
          ) : null}
        </>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* ── EXPENSES TAB ── */}
      {/* ══════════════════════════════════════════════════ */}
      {tab === "expenses" && (
        <>
          {/* Header with date filter and Add button */}
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center">
            <Receipt size={18} className="text-teal-700" />
            <span className="text-sm font-semibold text-slate-900">Biaya Operasional</span>
            <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:items-center">
              <input type="date" className="h-11 rounded-lg border border-slate-200 px-3 text-sm sm:h-9" value={expStart} onChange={(e) => setExpStart(e.target.value)} />
              <span className="text-xs text-slate-400">sampai</span>
              <input type="date" className="h-11 rounded-lg border border-slate-200 px-3 text-sm sm:h-9" value={expEnd} onChange={(e) => setExpEnd(e.target.value)} />
              <button
                onClick={() => setShowExpenseForm(true)}
                className="flex h-11 items-center justify-center gap-1.5 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 sm:ml-2 sm:h-9"
              >
                <Plus size={16} />
                Catat Pengeluaran
              </button>
            </div>
          </div>

          {/* Add expense modal */}
          {showExpenseForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4" onClick={() => setShowExpenseForm(false)}>
              <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-950">Catat Pengeluaran Baru</h3>
                  <button onClick={() => setShowExpenseForm(false)} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100">
                    <X size={18} />
                  </button>
                </div>
                <form
                  className="mt-5 space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!expenseForm.description || !expenseForm.amount) return;
                    createExpense.mutate({
                      category: expenseForm.category,
                      description: expenseForm.description,
                      amount: parseFloat(expenseForm.amount),
                      date: expenseForm.date,
                    });
                  }}
                >
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">Kategori</label>
                    <select
                      className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    >
                      {EXPENSE_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">Keterangan</label>
                    <input
                      type="text"
                      className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                      placeholder="Contoh: Sewa ruko bulanan"
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">Nominal (IDR)</label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                      placeholder="0"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">Tanggal</label>
                    <input
                      type="date"
                      className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                      value={expenseForm.date}
                      onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={createExpense.isPending}
                    className="flex h-10 w-full items-center justify-center rounded-lg bg-slate-950 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    {createExpense.isPending ? <Loader2 className="animate-spin" size={16} /> : "Simpan Pengeluaran"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Expense list */}
          {expLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              {(!expenses || expenses.length === 0) ? (
                <div className="px-4 py-16 text-center">
                  <div className="mx-auto grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-400">
                    <Receipt size={22} />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-700">Belum ada pengeluaran tercatat</p>
                  <p className="mt-1 text-xs text-slate-500">Catat pengeluaran pertama Anda untuk mulai memantau biaya operasional bisnis.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {/* Table header */}
                  <div className="hidden grid-cols-[1fr_120px_1fr_140px_48px] gap-3 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 md:grid">
                    <span>Keterangan</span>
                    <span>Kategori</span>
                    <span>Dicatat oleh</span>
                    <span className="text-right">Nominal</span>
                    <span />
                  </div>
                  {expenses.map((exp: any) => {
                    const meta = EXPENSE_CATEGORIES.find((c) => c.value === exp.category) || EXPENSE_CATEGORIES[5];
                    return (
                      <div key={exp.id} className="grid gap-3 px-4 py-4 text-sm hover:bg-slate-50 md:grid-cols-[1fr_120px_1fr_140px_48px] md:items-center md:px-5 md:py-3">
                        <div>
                          <p className="font-semibold text-slate-900">{exp.description}</p>
                          <p className="text-[11px] text-slate-400">{new Date(exp.date).toLocaleDateString("id-ID", { dateStyle: "medium" })}</p>
                        </div>
                        <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.color}`}>
                          <meta.icon size={12} />
                          {meta.label}
                        </span>
                        <span className="text-xs text-slate-500">{exp.createdBy?.name || "-"}</span>
                        <span className="text-right text-sm font-bold text-slate-900">{formatCurrency(exp.amount)}</span>
                        <button
                          onClick={() => { if (confirm("Hapus pengeluaran ini?")) deleteExpense.mutate(exp.id); }}
                          className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          title="Hapus"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────

function PLCard({
  icon: Icon, iconBg, label, value, sub, negative, highlight,
}: {
  icon: typeof TrendingUp; iconBg: string; label: string; value: number; sub?: string; negative?: boolean; highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border bg-white p-5 shadow-sm ${highlight ? "border-slate-300 ring-1 ring-slate-200" : "border-slate-200"}`}>
      <div className={`mb-2 inline-grid size-10 place-items-center rounded-lg ${iconBg}`}>
        <Icon size={20} />
      </div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${negative ? "text-slate-900" : value >= 0 ? "text-slate-950" : "text-red-600"}`}>
        {negative ? `(${formatCurrency(Math.abs(value))})` : formatCurrency(value)}
      </p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function ProgressBar({ label, amount, max, color }: { label: string; amount: number; max: number; color: string }) {
  const pct = Math.max(0, Math.min(100, (Math.abs(amount) / max) * 100));
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700">{label}</span>
        <span className={`text-xs font-bold ${amount >= 0 ? "text-slate-900" : "text-red-600"}`}>{formatCurrency(amount)}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function BSSection({
  title, icon, color, items, total,
}: {
  title: string; icon: React.ReactNode; color: string; items: { label: string; amount: number }[]; total: number;
}) {
  const colorMap: Record<string, { bg: string; text: string; border: string; badge: string }> = {
    teal: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", badge: "bg-teal-100 text-teal-800" },
    rose: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", badge: "bg-rose-100 text-rose-800" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", badge: "bg-indigo-100 text-indigo-800" },
  };
  const c = colorMap[color] || colorMap.teal;

  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-5 shadow-sm`}>
      <div className="flex items-center gap-2">
        <div className={`grid size-8 place-items-center rounded-lg ${c.badge}`}>{icon}</div>
        <h3 className={`text-sm font-bold ${c.text}`}>{title}</h3>
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-xs text-slate-600">{item.label}</span>
            <span className="text-sm font-semibold text-slate-900">{formatCurrency(item.amount)}</span>
          </div>
        ))}
      </div>
      <div className={`mt-4 border-t ${c.border} pt-3`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold ${c.text}`}>Total {title}</span>
          <span className="text-lg font-bold text-slate-950">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}
