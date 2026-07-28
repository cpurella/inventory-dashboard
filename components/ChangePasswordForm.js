"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus(null);
    if (newPassword !== confirmPassword) {
      setStatus({ ok: false, message: "New password and confirmation don't match." });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not change password.");
      setStatus({ ok: true, message: "Password changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setStatus({ ok: false, message: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <KeyRound className="w-4 h-4 text-teal-400" />
        <h3 className="text-sm font-medium text-[var(--text-primary)]">Change Password</h3>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs uppercase tracking-wide text-[var(--text-muted)] block mb-1">Current Password</label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full bg-[var(--bg-nested)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-teal-500/50"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs uppercase tracking-wide text-[var(--text-muted)] block mb-1">New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-[var(--bg-nested)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-teal-500/50"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-[var(--text-muted)] block mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[var(--bg-nested)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-teal-500/50"
            />
          </div>
        </div>

        {status && (
          <div className={`text-sm rounded-md p-3 ${status.ok ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
            {status.message}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="bg-teal-500 text-black text-sm font-medium px-4 py-2 rounded-md hover:bg-teal-400 disabled:opacity-50"
        >
          {busy ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}
