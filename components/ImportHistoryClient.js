"use client";

import { useEffect, useState } from "react";
import { History, Info } from "lucide-react";

export default function ImportHistoryClient() {
  const [alreadyImported, setAlreadyImported] = useState(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetch("/api/import-history")
      .then((r) => r.json())
      .then((d) => setAlreadyImported(d.alreadyImported ?? 0))
      .catch(() => {});
  }, []);

  async function handleImport() {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/import-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "YES" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed.");
      setStatus({ ok: true, message: `Imported ${data.imported} historical entries (of ${data.totalInFile} found in the original bin cards).` });
      setAlreadyImported(data.imported);
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
          Loads every individual receipt and issue recorded in the original Bin Card sheets
          (Jan – Jul 2026) as dated entries, so each item's report shows full day-by-day history —
          not just monthly totals.
        </p>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
        <div className="text-sm text-[var(--text-primary)]">
          This does <strong>not</strong> change any current balance — balances were already correct
          from the monthly totals. This only adds detailed history for viewing. Safe to run more than
          once; re-running replaces the previous import instead of duplicating it, and never touches
          entries you've logged manually.
          {alreadyImported != null && (
            <div className="mt-2 text-xs text-[var(--text-muted)]">
              Currently imported: <strong className="text-[var(--text-primary)]">{alreadyImported}</strong> entries.
            </div>
          )}
        </div>
      </div>

      <button
        onClick={handleImport}
        disabled={busy}
        className="flex items-center gap-2 bg-teal-500 text-black text-sm font-medium px-4 py-2 rounded-md hover:bg-teal-400 disabled:opacity-50"
      >
        <History className="w-4 h-4" />
        {busy ? "Importing..." : "Import Historical Data"}
      </button>

      {status && (
        <div className={`text-sm rounded-md p-3 ${status.ok ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
          {status.message}
        </div>
      )}
    </div>
  );
}
