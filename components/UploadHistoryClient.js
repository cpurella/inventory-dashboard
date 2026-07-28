"use client";

import { useEffect, useState } from "react";
import { FileSpreadsheet, Trash2, Info } from "lucide-react";

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function UploadHistoryClient() {
  const [logs, setLogs] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    const res = await fetch("/api/upload-history");
    const data = await res.json();
    setLogs(data.logs || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id) {
    if (!window.confirm("Remove this entry from the upload history? (This only removes the log — it does not undo the data merge.)")) {
      return;
    }
    setBusyId(id);
    try {
      await fetch(`/api/upload-history/${id}`, { method: "DELETE" });
      setLogs((prev) => prev.filter((l) => l.id !== id));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4 text-[var(--text-primary)]">
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
        <div className="text-sm text-[var(--text-primary)]">
          Deleting an entry here only removes it from this list — it does <strong>not</strong> undo the
          item/category/monthly updates that upload already made.
        </div>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--text-primary)]">Past Uploads</h3>
        </div>
        <div className="max-h-[600px] overflow-y-auto divide-y divide-[var(--border-subtle)]">
          {logs === null && (
            <div className="p-8 text-center text-[var(--text-muted)] text-sm">Loading...</div>
          )}
          {logs && logs.length === 0 && (
            <div className="p-8 text-center text-[var(--text-muted)] text-sm">No files uploaded yet.</div>
          )}
          {logs && logs.map((l) => (
            <div key={l.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <FileSpreadsheet className="w-5 h-5 text-teal-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm text-[var(--text-primary)] truncate">{l.filename}</div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    {fmtDate(l.createdAt)} {l.uploadedByName ? `· by ${l.uploadedByName}` : ""}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0 ml-3">
                <div className="text-right text-[11px] text-[var(--text-secondary)]">
                  <div><span className="text-emerald-400">{l.itemsUpdated}</span> updated</div>
                  <div><span className="text-sky-400">{l.itemsAdded}</span> added</div>
                </div>
                <button
                  onClick={() => handleDelete(l.id)}
                  disabled={busyId === l.id}
                  className="text-[var(--text-secondary)] hover:text-rose-400 disabled:opacity-50"
                  title="Remove from history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
