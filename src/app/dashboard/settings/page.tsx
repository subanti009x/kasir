"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { settingsApi } from "@/lib/api";
import { ImageUp, Save, Loader2, Store, CreditCard, Receipt } from "lucide-react";

export default function SettingsPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

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

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-300" size={28} /></div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Store Profile */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <Store size={18} className="text-teal-700" />
          <h2 className="text-lg font-bold text-slate-950">Store Profile</h2>
        </div>
        <div className="mb-5 flex items-center gap-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
          <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-950 text-sm font-bold text-white">
            {settings?.logo ? <img src={settings.logo} alt="" className="h-full w-full object-cover" /> : (settings?.name || "S").charAt(0)}
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-teal-300 hover:text-teal-700">
            {logoMut.isPending ? <Loader2 className="animate-spin" size={15} /> : <ImageUp size={15} />}
            Upload logo
            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) logoMut.mutate(file); }} />
          </label>
          {logoMut.isError && <span className="text-xs text-red-600">{(logoMut.error as any)?.message || "Upload failed"}</span>}
        </div>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); updateMut.mutate({ ...form, taxRate: +form.taxRate }); }}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="text-xs font-medium text-slate-600">Store Name</label><input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="text-xs font-medium text-slate-600">Email</label><input type="email" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="text-xs font-medium text-slate-600">Phone</label><input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><label className="text-xs font-medium text-slate-600">Business Hours</label><input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" placeholder="08:00 - 21:00" value={form.businessHours} onChange={(e) => setForm({ ...form, businessHours: e.target.value })} /></div>
          </div>
          <div><label className="text-xs font-medium text-slate-600">Address</label><textarea className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="text-xs font-medium text-slate-600">Currency</label><input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
            <div><label className="text-xs font-medium text-slate-600">Tax Rate (%)</label><input type="number" step="0.1" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: +e.target.value })} /></div>
          </div>
          <div><label className="text-xs font-medium text-slate-600">Receipt Template</label><textarea className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm" rows={3} value={form.receiptTemplate} onChange={(e) => setForm({ ...form, receiptTemplate: e.target.value })} /></div>
          <button type="submit" disabled={updateMut.isPending} className="flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-6 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
            {updateMut.isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save Changes
          </button>
          {updateMut.isSuccess && <p className="text-xs text-emerald-600">Settings saved successfully!</p>}
        </form>
      </div>

      {/* Payment Methods */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <CreditCard size={18} className="text-teal-700" />
          <h2 className="text-lg font-bold text-slate-950">Payment Methods</h2>
        </div>
        <div className="space-y-2">
          {paymentMethods.map((m: any) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
              <span className="text-sm font-semibold text-slate-900">{m.name}</span>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" className="peer sr-only" checked={m.enabled} onChange={() => togglePayment.mutate({ id: m.id, enabled: !m.enabled })} />
                <div className="h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:bg-teal-600 peer-checked:after:translate-x-full"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Tenant info */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Receipt size={18} className="text-teal-700" />
          <h2 className="text-lg font-bold text-slate-950">Account Info</h2>
        </div>
        <div className="grid gap-2 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Plan</span><span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-bold text-violet-700">{settings?.plan || "BASIC"}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Status</span><span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">{settings?.status || "ACTIVE"}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Tenant ID</span><span className="font-mono text-xs text-slate-400">{settings?.id}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Created</span><span className="text-slate-600">{settings?.createdAt ? new Date(settings.createdAt).toLocaleDateString("id-ID") : "—"}</span></div>
        </div>
      </div>
    </div>
  );
}
