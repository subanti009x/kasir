import {
  LayoutDashboard,
  CircleDollarSign,
  Store,
  Banknote,
  QrCode,
  CreditCard,
  SlidersHorizontal,
  WalletCards,
} from "lucide-react";
import React from "react";

export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4 ${className}`}>{children}</div>;
}

export function SectionHeader({
  icon: Icon,
  subtitle,
  title,
}: {
  icon: typeof LayoutDashboard;
  subtitle: string;
  title: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
      <Icon className="shrink-0 text-teal-700" size={23} />
    </div>
  );
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/10 p-3">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-slate-300">{label}</p>
    </div>
  );
}

export function InsightCard({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: typeof CircleDollarSign;
  label: string;
  tone: "teal" | "sky" | "amber" | "rose";
  value: string;
}) {
  const tones = {
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    sky: "bg-sky-50 text-sky-700",
    teal: "bg-teal-50 text-teal-700",
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`mb-4 inline-grid size-10 place-items-center rounded-lg ${tones[tone]}`}>
        <Icon size={20} />
      </div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold tracking-normal">{value}</p>
    </div>
  );
}

export function SettingTile({ icon: Icon, label, value }: { icon: typeof Store; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-sm font-bold">
        <Icon className="text-teal-700" size={17} />
        {label}
      </div>
      <p className="mt-2 text-sm leading-5 text-slate-600">{value}</p>
    </div>
  );
}

export function DataRow({ label, meta, value }: { label: string; meta: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{label}</p>
        <p className="truncate text-xs text-slate-500">{meta}</p>
      </div>
      <p className="shrink-0 text-sm font-bold">{value}</p>
    </div>
  );
}

export function StatusBadge({ children, tone }: { children: React.ReactNode; tone: "emerald" | "amber" | "rose" }) {
  const tones = {
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
  };

  return <span className={`rounded-md px-2 py-1 text-xs font-bold ${tones[tone]}`}>{children}</span>;
}

export function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      {children}
    </label>
  );
}

export function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-slate-600">
      <span>{label}</span>
      <span className="font-semibold text-slate-950">{value}</span>
    </div>
  );
}

export function Permission({ enabled, label }: { enabled: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
      <span>{label}</span>
      <span className={`rounded-md px-2 py-1 text-xs font-bold ${enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
        {enabled ? "Diizinkan" : "Dibatasi"}
      </span>
    </div>
  );
}

export function IconButton({
  children,
  dark = false,
  label,
  onClick,
}: {
  children: React.ReactNode;
  dark?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className={`grid size-10 place-items-center rounded-md sm:size-8 ${dark ? "bg-slate-950 text-white" : "border border-slate-200 bg-white"}`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

export function methodIcon(method: string) {
  if (method === "Cash") return <Banknote size={17} />;
  if (method === "QRIS") return <QrCode size={17} />;
  if (method === "Bank Transfer") return <CreditCard size={17} />;
  if (method === "Split Payment") return <SlidersHorizontal size={17} />;
  return <WalletCards size={17} />;
}
