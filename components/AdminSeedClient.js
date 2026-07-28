"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

export default function AdminSeedClient() {
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleReset() {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "YES" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed.");
      setStatus({ ok: true, message: `Done — ${data.itemsSeeded} items reloaded from the original data.` });
      setConfirming(false);
    } catch (err) {
      setStatus({ ok: false, message: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-lg space-y-4 text-[var(--text-primary)]">
      <div>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          This wipes the live database and reloads it from the original inventory file bundled with the app.
          Use this only if something needs to be started over.
        </p>
      </div>

      <div className="bg-[var(--bg-card)] border border-rose-500/30 rounded-xl p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        <div className="text-sm text-[var(--text-primary)]">
          <strong className="text-rose-400">Warning:</strong> this permanently deletes every GRN, Usage, and Damage
          entry that has been logged so far. This cannot be undone.
        </div>
      </div>

      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="bg-[var(--bg-card)] border border-[var(--border)] text-sm px-4 py-2 rounded-md hover:bg-[var(--hover-overlay)]"
        >
          Reset Data...
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            disabled={busy}
            className="bg-rose-500 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-rose-400 disabled:opacity-50"
          >
            {busy ? "Resetting..." : "Yes, erase everything and reset"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={busy}
            className="text-sm px-4 py-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--hover-overlay)]"
          >
            Cancel
          </button>
        </div>
      )}

      {status && (
        <div className={`text-sm rounded-md p-3 ${status.ok ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
          {status.message}
        </div>
      )}
    </div>
  );
}
