"use client";

import { useMemo, useState } from "react";
import { Search, Printer, Download, FileText } from "lucide-react";
import { MONTH_LABELS, STOCK_AS_OF } from "../lib/data";

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
  lines.push(`Current Stock (as of ${STOCK_AS_OF}),${item.currentStock}`);
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
    <div className="space-y-4 text-slate-200">
      <div className="text-xs text-slate-500 print:hidden">
        ఏదైనా item వెతికి select చేయండి — దాని పూర్తి రిపోర్ట్ (12 నెలల movement) ఇక్కడ కనిపిస్తుంది. Print / Save as PDF లేదా CSV గా డౌన్‌లోడ్ చేసుకోవచ్చు.
      </div>

      {/* Search */}
      <div className="relative w-full md:w-96 print:hidden">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Item code లేదా పేరు టైప్ చేయండి..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-[#12151c] border border-[#232733] rounded-md pl-9 pr-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
        />
        {matches.length > 0 && (
          <div className="absolute z-20 mt-1 w-full bg-[#12151c] border border-[#232733] rounded-md shadow-lg max-h-72 overflow-y-auto">
            {matches.map((it) => (
              <button
                key={it.id}
                onClick={() => { setSelectedId(it.id); setQuery(""); }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 border-b border-[#1c2029] last:border-b-0"
              >
                <div className="text-slate-200">{it.description}</div>
                <div className="text-[11px] text-slate-500">{it.code} · {it.category} · {it.uom}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {!selected && (
        <div className="bg-[#12151c] border border-[#232733] rounded-xl p-10 text-center text-slate-500 print:hidden">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          రిపోర్ట్ చూడటానికి పైన item వెతకండి.
        </div>
      )}

      {selected && (
        <div className="space-y-4" id="report-content">
          <div className="flex flex-wrap gap-2 print:hidden">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-amber-500 text-black text-sm font-medium px-3 py-1.5 rounded-md hover:bg-amber-400"
            >
              <Printer className="w-4 h-4" /> Print / Save as PDF
            </button>
            <button
              onClick={() => downloadCsv(selected)}
              className="flex items-center gap-1.5 bg-[#12151c] border border-[#232733] text-sm px-3 py-1.5 rounded-md hover:bg-white/5"
            >
              <Download className="w-4 h-4" /> Download CSV
            </button>
          </div>

          <div className="bg-[#12151c] border border-[#232733] rounded-xl p-6 print:bg-white print:text-black print:border-0">
            <div className="text-xs font-mono text-slate-500 print:text-black">Code: {selected.code}</div>
            <h2 className="text-xl font-semibold text-white print:text-black">{selected.description}</h2>
            <div className="text-sm text-slate-500 print:text-black">
              Unit: {selected.uom} · Category: {selected.category}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
              <Metric label="Current Stock" value={fmt(selected.currentStock)} note={`as of ${STOCK_AS_OF}`} />
              <Metric label="Year Added" value={fmt(selected.yearTotal.added)} valueClass="text-emerald-400 print:text-black" />
              <Metric label="Year Usage" value={fmt(selected.yearTotal.usage)} valueClass="text-rose-400 print:text-black" />
              <Metric label="Avg / Day" value={fmt(selected.avgPerDay)} />
              <Metric
                label="Run-out in"
                value={selected.runoutDays != null ? `${fmt(selected.runoutDays)} days` : "-"}
                note={selected.runoutDate || ""}
                valueClass="text-amber-400 print:text-black"
              />
            </div>
          </div>

          <div className="bg-[#12151c] border border-[#232733] rounded-xl overflow-hidden print:bg-white print:border-0">
            <div className="px-4 py-3 border-b border-[#232733] print:border-black">
              <h3 className="text-sm font-medium text-slate-300 print:text-black">Monthly Movement — 2026</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 text-xs uppercase tracking-wider border-b border-[#232733] print:text-black print:border-black">
                  <th className="px-4 py-2.5">Month</th>
                  <th className="px-4 py-2.5 text-right">Opening</th>
                  <th className="px-4 py-2.5 text-right">Added</th>
                  <th className="px-4 py-2.5 text-right">Usage</th>
                  <th className="px-4 py-2.5 text-right">Closing</th>
                </tr>
              </thead>
              <tbody>
                {selected.months.map((m) => (
                  <tr key={m.month} className="border-b border-[#1c2029] print:border-gray-300 print:text-black">
                    <td className="px-4 py-2">{MONTH_LABELS[m.month]} 2026</td>
                    <td className="px-4 py-2 text-right">{fmt(m.opening)}</td>
                    <td className="px-4 py-2 text-right text-emerald-400 print:text-black">{fmt(m.added)}</td>
                    <td className="px-4 py-2 text-right text-rose-400 print:text-black">{fmt(m.usage)}</td>
                    <td className="px-4 py-2 text-right font-semibold text-white print:text-black">{fmt(m.closing)}</td>
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

function Metric({ label, value, note, valueClass = "text-white print:text-black" }) {
  return (
    <div>
      <div className="text-xs text-slate-500 print:text-black">{label}</div>
      <div className={`text-lg font-semibold ${valueClass}`}>{value}</div>
      {note && <div className="text-[10px] text-slate-500 print:text-black">{note}</div>}
    </div>
  );
}
