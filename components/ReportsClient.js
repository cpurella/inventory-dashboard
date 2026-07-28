"use client";

import { useMemo, useState } from "react";
import { Search, Printer, Download, FileText } from "lucide-react";
import { MONTH_LABELS } from "@/lib/constants";

function fmt(n) {
  if (n === null || n === undefined) return "-";
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function downloadCsv(item) {
  const header = ["Month", "Opening", "Added", "Usage", "Closing"];
  const lines = [header.join(",")];
  for (const m of item.months) {
    lines.push([MONTH_LABELS[m.month] + " 2026", m.opening, m.added, m.usage, m.closing].join(","));
  }
  lines.push("");
  lines.push(`Code,${item.code}`);
  lines.push(`Description,"${(item.description || "").replace(/"/g, '""')}"`);
  lines.push(`Category,${item.category}`);
  lines.push(`UOM,${item.uom}`);
  lines.push(`Current Stock (live balance),${item.currentStock}`);
  lines.push(`Run-out Days,${item.runoutDays ?? "-"}`);
  lines.push(`Next Reorder Date,${item.runoutDate ?? "-"}`);

  const csv = lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `item-${item.code}-report.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ReportsClient({ items }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return items
      .filter(
        (it) =>
          String(it.code).toLowerCase().includes(q) ||
          (it.description || "").toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [items, query]);

  const selected = useMemo(
    () => items.find((it) => it.id === selectedId) || null,
    [items, selectedId]
  );

  return (
    <div className="space-y-4 text-[var(--text-primary)]">
      <div className="text-xs text-[var(--text-muted)] print:hidden">
        Search for any item below to see its full report (12-month movement). You can print it, save as PDF, or download as CSV.
      </div>

      {/* Search */}
      <div className="relative w-full md:w-96 print:hidden">
        <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Type item code or name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-md pl-9 pr-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
        />
        {matches.length > 0 && (
          <div className="absolute z-20 mt-1 w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-md shadow-lg max-h-72 overflow-y-auto">
            {matches.map((it) => (
              <button
                key={it.id}
                onClick={() => { setSelectedId(it.id); setQuery(""); }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--hover-overlay)] border-b border-[var(--border-subtle)] last:border-b-0"
              >
                <div className="text-[var(--text-primary)]">{it.description}</div>
                <div className="text-[11px] text-[var(--text-muted)]">{it.code} · {it.category} · {it.uom}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {!selected && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-10 text-center text-[var(--text-muted)] print:hidden">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          Search for an item above to view its report.
        </div>
      )}

      {selected && (
        <div className="space-y-4" id="report-content">
          <div className="flex flex-wrap gap-2 print:hidden">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-teal-500 text-black text-sm font-medium px-3 py-1.5 rounded-md hover:bg-teal-400"
            >
              <Printer className="w-4 h-4" /> Print / Save as PDF
            </button>
            <button
              onClick={() => downloadCsv(selected)}
              className="flex items-center gap-1.5 bg-[var(--bg-card)] border border-[var(--border)] text-sm px-3 py-1.5 rounded-md hover:bg-[var(--hover-overlay)]"
            >
              <Download className="w-4 h-4" /> Download CSV
            </button>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 print:bg-white print:text-black print:border-0">
            <div className="text-xs font-mono text-[var(--text-muted)] print:text-black">Code: {selected.code}</div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] print:text-black">{selected.description}</h2>
            <div className="text-sm text-[var(--text-muted)] print:text-black">
              Unit: {selected.uom} · Category: {selected.category}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
              <Metric label="Current Stock" value={fmt(selected.currentStock)} note="live balance" />
              <Metric label="Year Added" value={fmt(selected.yearTotal.added)} valueClass="text-emerald-400 print:text-black" />
              <Metric label="Year Usage" value={fmt(selected.yearTotal.usage)} valueClass="text-rose-400 print:text-black" />
              <Metric label="Avg / Day" value={fmt(selected.avgPerDay)} />
              <Metric
                label="Run-out in"
                value={selected.runoutDays != null ? `${fmt(selected.runoutDays)} days` : "-"}
                note={selected.runoutDate || ""}
                valueClass="text-teal-400 print:text-black"
              />
            </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden print:bg-white print:border-0">
            <div className="px-4 py-3 border-b border-[var(--border)] print:border-black">
              <h3 className="text-sm font-medium text-[var(--text-primary)] print:text-black">Monthly Movement — 2026</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--text-muted)] text-xs uppercase tracking-wider border-b border-[var(--border)] print:text-black print:border-black">
                  <th className="px-4 py-2.5">Month</th>
                  <th className="px-4 py-2.5 text-right">Opening</th>
                  <th className="px-4 py-2.5 text-right">Added</th>
                  <th className="px-4 py-2.5 text-right">Usage</th>
                  <th className="px-4 py-2.5 text-right">Closing</th>
                </tr>
              </thead>
              <tbody>
                {selected.months.map((m) => (
                  <tr key={m.month} className="border-b border-[var(--border-subtle)] print:border-gray-300 print:text-black">
                    <td className="px-4 py-2">{MONTH_LABELS[m.month]} 2026</td>
                    <td className="px-4 py-2 text-right">{fmt(m.opening)}</td>
                    <td className="px-4 py-2 text-right text-emerald-400 print:text-black">{fmt(m.added)}</td>
                    <td className="px-4 py-2 text-right text-rose-400 print:text-black">{fmt(m.usage)}</td>
                    <td className="px-4 py-2 text-right font-semibold text-[var(--text-primary)] print:text-black">{fmt(m.closing)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, note, valueClass = "text-[var(--text-primary)] print:text-black" }) {
  return (
    <div>
      <div className="text-xs text-[var(--text-muted)] print:text-black">{label}</div>
      <div className={`text-lg font-semibold ${valueClass}`}>{value}</div>
      {note && <div className="text-[10px] text-[var(--text-muted)] print:text-black">{note}</div>}
    </div>
  );
}
