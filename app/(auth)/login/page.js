"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed.");
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="bg-[#12151c] border border-[#232733] rounded-xl p-6 space-y-4">
      <h1 className="text-lg font-semibold text-white text-center">Sign in</h1>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs uppercase tracking-wide text-slate-500 block mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#0e1117] border border-[#232733] rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500/50"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-slate-500 block mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#0e1117] border border-[#232733] rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500/50"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="text-sm rounded-md p-3 bg-rose-500/10 text-rose-400">{error}</div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 bg-teal-500 text-black text-sm font-medium px-4 py-2 rounded-md hover:bg-teal-400 disabled:opacity-50"
        >
          <LogIn className="w-4 h-4" />
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="text-center text-xs text-slate-600">
        Need access? Ask an admin to add your account from Settings.
      </div>
    </div>
  );
}
