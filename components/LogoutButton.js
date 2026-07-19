"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={busy}
      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition disabled:opacity-50"
    >
      <LogOut className="w-3.5 h-3.5" />
      {busy ? "Signing out..." : "Logout"}
    </button>
  );
}
