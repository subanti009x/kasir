"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { settingsApi, whatsappApi } from "@/lib/api";
import { useFeatures } from "@/lib/useFeatures";
import { useNotifications } from "@/lib/useNotifications";
import {
  ImageUp, Save, Loader2, Store, CreditCard, Receipt,
  MessageCircle, Wifi, WifiOff, QrCode, RotateCcw,
  CheckCircle2, XCircle, Clock, Send, ChevronLeft, ChevronRight,
  Settings2, ScrollText, Smartphone,
} from "lucide-react";
import QRCodeLib from "qrcode";

// ── Status badge component ────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; icon: typeof CheckCircle2; label: string }> = {
    PENDING: { color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock, label: "Pending" },
    SENDING: { color: "bg-blue-50 text-blue-700 border-blue-200", icon: Send, label: "Mengirim" },
    SENT: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2, label: "Terkirim" },
    FAILED: { color: "bg-red-50 text-red-700 border-red-200", icon: XCircle, label: "Gagal" },
  };
  const s = map[status] || map.PENDING;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${s.color}`}>
      <Icon size={11} /> {s.label}
    </span>
  );
}

export default function SettingsPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { hasFeature } = useFeatures();
  const notifications = useNotifications();

  // ── Store Settings ──
  const { data: settings, isLoading } = useQuery({ queryKey: ["settings"], queryFn: () => settingsApi.get(token!), enabled: !!token });
  const { data: paymentMethods = [] } = useQuery({ queryKey: ["payment-methods"], queryFn: () => settingsApi.paymentMethods(token!), enabled: !!token });

  const [form, setForm] = useState({ name: "", address: "", phone: "", email: "", businessHours: "", currency: "IDR", taxRate: 0, receiptTemplate: "" });

  useEffect(() => {
    if (settings) setForm({ name: settings.name || "", address: settings.address || "", phone: settings.phone || "", email: settings.email || "", businessHours: settings.businessHours || "", currency: settings.currency || "IDR", taxRate: settings.taxRate || 0, receiptTemplate: settings.receiptTemplate || "" });
  }, [settings]);

  const updateMut = useMutation({ mutationFn: (d: any) => settingsApi.update(token!, d), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] }) });
  const logoMut = useMutation({
    mutationFn: (file: File) => settingsApi.uploadLogo(token!, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
  });
  const togglePayment = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => settingsApi.updatePaymentMethod(token!, id, enabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payment-methods"] }),
  });

  // ── WhatsApp Feature ──
  const showWhatsapp = hasFeature("WHATSAPP_RECEIPT");
  const { data: waConfig, isLoading: _waConfigLoading } = useQuery({
    queryKey: ["whatsapp-config"],
    queryFn: () => whatsappApi.getConfig(token!),
    enabled: !!token && showWhatsapp,
    refetchInterval: 10000,
  });
  const { data: waStats } = useQuery({
    queryKey: ["whatsapp-stats"],
    queryFn: () => whatsappApi.getStats(token!),
    enabled: !!token && showWhatsapp,
    refetchInterval: 5000,
  });
  const [waLogFilter, setWaLogFilter] = useState("");
  const [waLogPage, setWaLogPage] = useState(1);
  const { data: waLogs } = useQuery({
    queryKey: ["whatsapp-logs", waLogFilter, waLogPage],
    queryFn: () => whatsappApi.getLogs(token!, { status: waLogFilter || undefined, page: waLogPage, limit: 10 }),
    enabled: !!token && showWhatsapp,
    refetchInterval: 5000,
  });

  // WhatsApp config form
  const [waForm, setWaForm] = useState({ botName: "", enabled: true, checkoutTemplate: "", refundTemplate: "" });
  const [waTab, setWaTab] = useState<"config" | "logs">("config");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (waConfig) {
      setWaForm({
        botName: waConfig.botName || "",
        enabled: waConfig.enabled ?? true,
        checkoutTemplate: waConfig.checkoutTemplate || "",
        refundTemplate: waConfig.refundTemplate || "",
      });
    }
  }, [waConfig]);

  // Listen for WebSocket events for QR code and status updates
  useEffect(() => {
    if (!notifications) return;

    const handleQR = (data: any) => {
      if (data?.qr) {
        QRCodeLib.toDataURL(data.qr, { width: 280, margin: 2 }).then((url: string) => {
          setQrDataUrl(url);
          setIsConnecting(true);
        }).catch(() => {});
      }
    };
    const handleStatus = (data: any) => {
      if (data?.status === "CONNECTED") {
        setQrDataUrl(null);
        setIsConnecting(false);
        queryClient.invalidateQueries({ queryKey: ["whatsapp-config"] });
      } else if (data?.status === "DISCONNECTED") {
        setQrDataUrl(null);
        setIsConnecting(false);
        queryClient.invalidateQueries({ queryKey: ["whatsapp-config"] });
      }
    };
    const handleLogUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-logs"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-stats"] });
    };

    notifications.on("whatsapp-qr", handleQR);
    notifications.on("whatsapp-status", handleStatus);
    notifications.on("whatsapp-log-update", handleLogUpdate);
    return () => {
      notifications.off("whatsapp-qr", handleQR);
      notifications.off("whatsapp-status", handleStatus);
      notifications.off("whatsapp-log-update", handleLogUpdate);
    };
  }, [notifications, queryClient]);

  const waUpdateMut = useMutation({
    mutationFn: (d: any) => whatsappApi.updateConfig(token!, d),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["whatsapp-config"] }),
  });
  const waConnectMut = useMutation({
    mutationFn: () => whatsappApi.connect(token!),
    onSuccess: () => setIsConnecting(true),
  });
  const waDisconnectMut = useMutation({
    mutationFn: () => whatsappApi.disconnect(token!),
    onSuccess: () => {
      setQrDataUrl(null);
      setIsConnecting(false);
      queryClient.invalidateQueries({ queryKey: ["whatsapp-config"] });
    },
  });
  const waRetryMut = useMutation({
    mutationFn: (logId: string) => whatsappApi.retryLog(token!, logId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-logs"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-stats"] });
    },
  });

  // Placeholder chips
  const placeholders = [
    { key: "customer_name", label: "Nama Member" },
    { key: "store_name", label: "Nama Toko" },
    { key: "receipt_id", label: "No. Struk" },
    { key: "date", label: "Tanggal" },
    { key: "items", label: "Daftar Item" },
    { key: "subtotal", label: "Subtotal" },
    { key: "tax", label: "Pajak" },
    { key: "total", label: "Total" },
    { key: "payment_method", label: "Metode Bayar" },
    { key: "amount_paid", label: "Dibayar" },
    { key: "change_due", label: "Kembalian" },
  ];

  const insertPlaceholder = useCallback((key: string, field: "checkoutTemplate" | "refundTemplate") => {
    setWaForm((prev) => ({
      ...prev,
      [field]: prev[field] + `{{${key}}}`,
    }));
  }, []);

  const isWaConnected = waConfig?.connectionStatus === "CONNECTED";

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-300" size={28} /></div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Store Profile */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <Store size={18} className="text-teal-700" />
          <h2 className="text-lg font-bold text-slate-950">Profil Toko</h2>
        </div>
        <div className="mb-5 flex items-center gap-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
          <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-950 text-sm font-bold text-white">
            {settings?.logo ? <img src={settings.logo} alt="" className="h-full w-full object-cover" /> : (settings?.name || "S").charAt(0)}
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-teal-300 hover:text-teal-700">
            {logoMut.isPending ? <Loader2 className="animate-spin" size={15} /> : <ImageUp size={15} />}
            Unggah logo
            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) logoMut.mutate(file); }} />
          </label>
          {logoMut.isError && <span className="text-xs text-red-600">{(logoMut.error as any)?.message || "Gagal mengunggah logo"}</span>}
        </div>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); updateMut.mutate({ ...form, taxRate: +form.taxRate }); }}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="text-xs font-medium text-slate-600">Nama Toko / Usaha</label><input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="text-xs font-medium text-slate-600">Alamat Email</label><input type="email" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="text-xs font-medium text-slate-600">Nomor Telepon</label><input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><label className="text-xs font-medium text-slate-600">Jam Operasional</label><input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" placeholder="08:00 - 21:00" value={form.businessHours} onChange={(e) => setForm({ ...form, businessHours: e.target.value })} /></div>
          </div>
          <div><label className="text-xs font-medium text-slate-600">Alamat Lengkap</label><textarea className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="text-xs font-medium text-slate-600">Mata Uang</label><input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
            <div><label className="text-xs font-medium text-slate-600">Tarif Pajak (%)</label><input type="number" step="0.1" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: +e.target.value })} /></div>
          </div>
          <div><label className="text-xs font-medium text-slate-600">Templat Struk Belanja</label><textarea className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm" rows={3} value={form.receiptTemplate} onChange={(e) => setForm({ ...form, receiptTemplate: e.target.value })} /></div>
          <button type="submit" disabled={updateMut.isPending} className="flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-6 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
            {updateMut.isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Simpan Perubahan
          </button>
          {updateMut.isSuccess && <p className="text-xs text-emerald-600">Pengaturan berhasil disimpan!</p>}
        </form>
      </div>

      {/* Payment Methods */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <CreditCard size={18} className="text-teal-700" />
          <h2 className="text-lg font-bold text-slate-950">Metode Pembayaran</h2>
        </div>
        <div className="space-y-2">
          {paymentMethods.map((m: any) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
              <span className="text-sm font-semibold text-slate-900">{m.name === "Cash" ? "Tunai" : m.name}</span>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" className="peer sr-only" checked={m.enabled} onChange={() => togglePayment.mutate({ id: m.id, enabled: !m.enabled })} />
                <div className="h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:bg-teal-600 peer-checked:after:translate-x-full"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────── */}
      {/* WhatsApp Configuration (only if feature enabled)    */}
      {/* ──────────────────────────────────────────────────── */}
      {showWhatsapp && (
        <div className="rounded-xl border border-emerald-200 bg-white shadow-sm overflow-hidden">
          {/* Header */}
          <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="grid size-9 place-items-center rounded-lg bg-emerald-600 text-white">
                  <MessageCircle size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-950">WhatsApp Bot</h2>
                  <p className="text-xs text-slate-500">Notifikasi otomatis ke member</p>
                </div>
              </div>
              {/* Connection status badge */}
              <div className="flex items-center gap-2">
                {isWaConnected ? (
                  <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    <Wifi size={12} /> Terhubung {waConfig?.connectedPhone ? `(${waConfig.connectedPhone})` : ""}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500">
                    <WifiOff size={12} /> Tidak Terhubung
                  </span>
                )}
              </div>
            </div>

            {/* Tab navigation */}
            <div className="mt-3 flex gap-1">
              <button
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${waTab === "config" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                onClick={() => setWaTab("config")}
              >
                <Settings2 size={13} /> Konfigurasi
              </button>
              <button
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${waTab === "logs" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                onClick={() => setWaTab("logs")}
              >
                <ScrollText size={13} /> Log Pengiriman
                {(waStats?.pending || 0) + (waStats?.sending || 0) > 0 && (
                  <span className="ml-1 grid size-4 place-items-center rounded-full bg-amber-500 text-[9px] font-bold text-white">
                    {(waStats?.pending || 0) + (waStats?.sending || 0)}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Tab: Config */}
          {waTab === "config" && (
            <div className="p-6 space-y-5">
              {/* Connection section */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <Smartphone size={15} /> Koneksi WhatsApp
                </p>
                {qrDataUrl ? (
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-xs text-slate-500">Scan QR Code ini menggunakan WhatsApp di HP Anda</p>
                    <div className="rounded-xl border-2 border-emerald-200 bg-white p-2 shadow-lg">
                      <img src={qrDataUrl} alt="WhatsApp QR Code" className="size-64" />
                    </div>
                    <p className="text-[11px] text-slate-400">WhatsApp → Menu → Perangkat tertaut → Tautkan perangkat</p>
                    <button
                      className="text-xs text-red-500 hover:text-red-700"
                      onClick={() => { setQrDataUrl(null); setIsConnecting(false); }}
                    >
                      Batal
                    </button>
                  </div>
                ) : isWaConnected ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid size-10 place-items-center rounded-full bg-emerald-100">
                        <CheckCircle2 className="text-emerald-600" size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-emerald-700">Terhubung</p>
                        <p className="text-xs text-slate-500">Nomor: {waConfig?.connectedPhone || "—"}</p>
                      </div>
                    </div>
                    <button
                      className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                      disabled={waDisconnectMut.isPending}
                      onClick={() => waDisconnectMut.mutate()}
                    >
                      {waDisconnectMut.isPending ? <Loader2 className="animate-spin" size={14} /> : "Putuskan"}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">Hubungkan nomor WhatsApp Anda untuk mengirim notifikasi otomatis</p>
                    <button
                      className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                      disabled={waConnectMut.isPending || isConnecting}
                      onClick={() => waConnectMut.mutate()}
                    >
                      {waConnectMut.isPending || isConnecting ? <Loader2 className="animate-spin" size={14} /> : <QrCode size={14} />}
                      {isConnecting ? "Menunggu scan..." : "Hubungkan WhatsApp"}
                    </button>
                  </div>
                )}
              </div>

              {/* Bot settings form */}
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  waUpdateMut.mutate(waForm);
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-slate-600">Nama Bot</label>
                    <input
                      className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                      value={waForm.botName}
                      onChange={(e) => setWaForm({ ...waForm, botName: e.target.value })}
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5">
                      <span className="text-xs font-medium text-slate-600">Notifikasi Aktif</span>
                      <div className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={waForm.enabled}
                          onChange={(e) => setWaForm({ ...waForm, enabled: e.target.checked })}
                        />
                        <div className="h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:bg-emerald-600 peer-checked:after:translate-x-full"></div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Placeholder chips */}
                <div>
                  <p className="mb-2 text-xs font-medium text-slate-500">Placeholder yang tersedia (klik untuk menambahkan):</p>
                  <div className="flex flex-wrap gap-1.5">
                    {placeholders.map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                        onClick={() => insertPlaceholder(p.key, "checkoutTemplate")}
                        title={`{{${p.key}}}`}
                      >
                        {`{{${p.key}}}`} <span className="text-emerald-500">({p.label})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Checkout template */}
                <div>
                  <label className="text-xs font-medium text-slate-600">Template Pesan — Transaksi Berhasil</label>
                  <textarea
                    className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm font-mono leading-relaxed"
                    rows={8}
                    value={waForm.checkoutTemplate}
                    onChange={(e) => setWaForm({ ...waForm, checkoutTemplate: e.target.value })}
                  />
                </div>

                {/* Refund template */}
                <div>
                  <label className="text-xs font-medium text-slate-600">Template Pesan — Refund</label>
                  <textarea
                    className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm font-mono leading-relaxed"
                    rows={5}
                    value={waForm.refundTemplate}
                    onChange={(e) => setWaForm({ ...waForm, refundTemplate: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={waUpdateMut.isPending}
                  className="flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-6 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {waUpdateMut.isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Simpan Konfigurasi
                </button>
                {waUpdateMut.isSuccess && <p className="text-xs text-emerald-600">Konfigurasi WhatsApp berhasil disimpan!</p>}
              </form>
            </div>
          )}

          {/* Tab: Delivery Logs */}
          {waTab === "logs" && (
            <div className="p-6 space-y-4">
              {/* Stats bar */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: "Total", value: waStats?.total || 0, color: "text-slate-700 bg-slate-50 border-slate-200" },
                  { label: "Terkirim", value: waStats?.sent || 0, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
                  { label: "Gagal", value: waStats?.failed || 0, color: "text-red-700 bg-red-50 border-red-200" },
                  { label: "Pending", value: (waStats?.pending || 0) + (waStats?.sending || 0), color: "text-amber-700 bg-amber-50 border-amber-200" },
                ].map((stat) => (
                  <div key={stat.label} className={`rounded-lg border p-3 text-center ${stat.color}`}>
                    <p className="text-xl font-bold">{stat.value}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Filter */}
              <div className="flex items-center gap-2">
                <select
                  className="h-9 rounded-lg border border-slate-200 px-3 text-sm"
                  value={waLogFilter}
                  onChange={(e) => { setWaLogFilter(e.target.value); setWaLogPage(1); }}
                >
                  <option value="">Semua Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="SENDING">Mengirim</option>
                  <option value="SENT">Terkirim</option>
                  <option value="FAILED">Gagal</option>
                </select>
                <span className="ml-auto text-xs text-slate-400">
                  Auto-refresh setiap 5 detik
                </span>
              </div>

              {/* Log table */}
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase text-slate-500">Tanggal</th>
                      <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase text-slate-500">Penerima</th>
                      <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase text-slate-500">Event</th>
                      <th className="px-3 py-2.5 text-center text-[11px] font-bold uppercase text-slate-500">Status</th>
                      <th className="px-3 py-2.5 text-center text-[11px] font-bold uppercase text-slate-500">Retry</th>
                      <th className="px-3 py-2.5 text-center text-[11px] font-bold uppercase text-slate-500">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(waLogs?.data || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-8 text-center text-sm text-slate-400">
                          Belum ada log pengiriman
                        </td>
                      </tr>
                    ) : (
                      (waLogs?.data || []).map((log: any) => (
                        <tr key={log.id} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="text-xs font-semibold text-slate-800">{log.recipientName}</p>
                            <p className="text-[11px] text-slate-400">{log.recipientPhone}</p>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`text-[10px] font-bold ${log.event === "CHECKOUT_SUCCESS" ? "text-teal-600" : "text-violet-600"}`}>
                              {log.event === "CHECKOUT_SUCCESS" ? "Checkout" : "Refund"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <StatusBadge status={log.status} />
                            {log.status === "FAILED" && log.errorMessage && (
                              <p className="mt-1 text-[10px] text-red-400 max-w-[150px] truncate" title={log.errorMessage}>
                                {log.errorMessage}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center text-xs text-slate-500">
                            {log.retryCount}/{log.maxRetries}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {log.status === "FAILED" && (
                              <button
                                className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                                disabled={waRetryMut.isPending}
                                onClick={() => waRetryMut.mutate(log.id)}
                              >
                                <RotateCcw size={10} /> Retry
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {waLogs && waLogs.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">
                    Halaman {waLogs.page} dari {waLogs.totalPages} ({waLogs.total} log)
                  </p>
                  <div className="flex gap-1">
                    <button
                      className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                      disabled={waLogPage <= 1}
                      onClick={() => setWaLogPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                      disabled={waLogPage >= (waLogs?.totalPages || 1)}
                      onClick={() => setWaLogPage((p) => p + 1)}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tenant info */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Receipt size={18} className="text-teal-700" />
          <h2 className="text-lg font-bold text-slate-950">Informasi Akun</h2>
        </div>
        <div className="grid gap-2 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Paket Layanan</span><span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-bold text-violet-700">{settings?.plan || "BASIC"}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Status</span><span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">{settings?.status === "ACTIVE" ? "AKTIF" : settings?.status || "—"}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">ID Tenant</span><span className="font-mono text-xs text-slate-400">{settings?.id}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Tanggal Pendaftaran</span><span className="text-slate-600">{settings?.createdAt ? new Date(settings.createdAt).toLocaleDateString("id-ID") : "—"}</span></div>
        </div>
      </div>
    </div>
  );
}
