"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Store, Eye, EyeOff, Loader2, ArrowRight, UserPlus } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, register, user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessSlug, setBusinessSlug] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already logged in
  if (authLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950">
        <Loader2 className="animate-spin text-white" size={40} />
      </main>
    );
  }

  if (user) {
    router.replace("/dashboard");
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register({ email, password, name, businessName, businessSlug });
      }
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Left - Branding */}
      <div className="hidden flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 p-12 lg:flex">
        <div>
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-xl bg-white/10 backdrop-blur-sm">
              <Store className="text-teal-400" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">KasirPro Cloud</h1>
              <p className="text-sm text-slate-400">Multi-Tenant POS SaaS</p>
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-4xl font-bold leading-tight text-white">
            Enterprise POS
            <br />
            <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              for Every Business
            </span>
          </h2>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-slate-400">
            Manage products, process transactions, track inventory, and view reports — all in one
            secure, multi-tenant platform designed for Indonesian SMEs.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { label: "Active SMEs", value: "248+" },
              { label: "Daily Transactions", value: "12K+" },
              { label: "Uptime", value: "99.98%" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="mt-1 text-xs text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-600">© 2026 KasirPro Cloud. Built with Next.js, NestJS, Prisma, PostgreSQL.</p>
      </div>

      {/* Right - Form */}
      <div className="flex items-center justify-center bg-white p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-lg bg-slate-950">
              <Store className="text-teal-400" size={20} />
            </div>
            <span className="text-lg font-bold">KasirPro Cloud</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-950">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {mode === "login"
              ? "Sign in to manage your business"
              : "Register to start your business on KasirPro"}
          </p>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {mode === "register" && (
              <>
                <div>
                  <label className="text-sm font-medium text-slate-700">Full Name</label>
                  <input
                    className="mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-600/10"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Business Name</label>
                    <input
                      className="mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-600/10"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="My Shop"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Business Slug</label>
                    <input
                      className="mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-600/10"
                      value={businessSlug}
                      onChange={(e) => setBusinessSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                      placeholder="my-shop"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input
                className="mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-600/10"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Password</label>
              <div className="relative mt-1.5">
                <input
                  className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 pr-11 text-sm outline-none transition focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-600/10"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 text-sm font-semibold text-white shadow-lg shadow-slate-950/20 transition hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : mode === "login" ? (
                <>
                  Sign in <ArrowRight size={16} />
                </>
              ) : (
                <>
                  Create account <UserPlus size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button className="font-semibold text-teal-700 hover:underline" onClick={() => { setMode("register"); setError(""); }}>
                  Register
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button className="font-semibold text-teal-700 hover:underline" onClick={() => { setMode("login"); setError(""); }}>
                  Sign in
                </button>
              </>
            )}
          </div>

          {mode === "login" && (
            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-600">Demo Accounts</p>
              <div className="mt-2 space-y-1 text-xs text-slate-500">
                <p><span className="font-medium text-slate-700">Super Admin:</span> admin@kasirpro.com / admin123</p>
                <p><span className="font-medium text-slate-700">Owner:</span> ayu@nusantarabakery.com / owner123</p>
                <p><span className="font-medium text-slate-700">Cashier:</span> raka@nusantarabakery.com / cashier123</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
