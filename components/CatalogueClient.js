"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, Download } from "lucide-react";
import { MONTH_KEYS, MONTH_LABELS } from "@/lib/constants";
import AddItemButton from "@/components/AddItemButton";

function fmt(n) {
  if (n === null || n === undefined) return "-";
  return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

const QUICK_FILTER_LABELS = {
  critical: "Critical Stock-outs (run-out within 15 days)",
  reorder: "Reorder Now (run-out in 16–30 days)",
  zero: "Zero Stock Lines (currently at 0 balance)",
};

function downloadCsv(rows, month) {
  const header = ["Code", "Description", "Category", "UOM", "Current Stock", `Added (${month})`, `Usage (${month})`, "Run-out Days", "Next Order"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push([
      r.code,
      `"${(r.description || "").replace(/"/g, '""')}"`,
      r.category,
      r.uom,
      r.currentStock,
      r.added,
      r.usage,
      r.runoutDays ?? "",
      r.runoutDate || "",
    ].join(","));
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `master-catalogue-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function CatalogueClient({ items, categories, defaultMonth }) {
  const searchParams = useSearchParams();

  const [month, setMonth] = useState(defaultMonth);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const [sortBy, setSortBy] = useState("currentStock");
  const [sortDir, setSortDir] = useState("desc");
  const [quickFilter, setQuickFilter] = useState(searchParams.get("filter") || null);

  const rows = useMemo(() => {
    return items.map((it) => {
      const md = it.months.find((m) => m.month === month) || { opening: 0, added: 0, usage: 0, closing: 0 };
      return {
        id: it.id,
        code: it.code,
        description: it.description,
        category: it.category,
        uom: it.uom,
        currentStock: it.currentStock,
        opening: md.opening,
        added: md.added,
        usage: md.usage,
        closing: md.closing,
        runoutDays: it.runoutDays,
        runoutDate: it.runoutDate,
      };
    });
  }, [items, month]);

  const categoryFiltered = useMemo(() => {
    if (category === "All") return rows;
    return rows.filter((r) => r.category === category);
  }, [rows, category]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = categoryFiltered;
    if (quickFilter === "critical") {
      list = list.filter((r) => r.runoutDays != null && r.runoutDays <= 15);
    } else if (quickFilter === "reorder") {
      list = list.filter((r) => r.runoutDays != null && r.runoutDays > 15 && r.runoutDays <= 30);
    } else if (quickFilter === "zero") {
      list = list.filter((r) => r.currentStock === 0);
    }
    if (q) {
      list = list.filter(
        (r) => String(r.code).toLowerCase().includes(q) || (r.description || "").toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      let va = a[sortBy];
      let vb = b[sortBy];
      if (typeof va === "string") va = va.toLowerCase();
      if (typeof vb === "string") vb = vb.toLowerCase();
      if (va == null) return 1;
      if (vb == null) return -1;
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [categoryFiltered, search, sortBy, sortDir, quickFilter]);

  function toggleSort(col) {
    if (sortBy === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("desc"); }
  }
  function sortArrow(col) {
    if (sortBy !== col) return "";
    return sortDir === "asc" ? " ▲" : " ▼";
  }

  return (
    <div className="space-y-4 text-slate-200">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Master Catalogue</h2>
          <p className="text-xs text-slate-500 mt-0.5">All tracked items, current stock, and monthly movement.</p>
        </div>
        <AddItemButton categories={categories} />
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Find code or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#12151c] border border-[#232733] rounded-md pl-9 pr-3 py-1.5 text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs uppercase tracking-wide text-slate-500">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-[#12151c] border border-[#232733] rounded-md px-3 py-1.5 text-sm"
          >
            <option value="All">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <label className="text-xs uppercase tracking-wide text-slate-500">Month</label>
          <input
            type="month"
            value={month}
            min="2026-01"
            max="2026-12"
            onChange={(e) => e.target.value && setMonth(e.target.value)}
            className="bg-[#12151c] border border-[#232733] rounded-md px-3 py-1.5 text-sm text-slate-200 [color-scheme:dark]"
          />
        </div>
      </div>

      <div className="bg-[#12151c] border border-[#232733] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#232733] flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-medium text-slate-300">
            {quickFilter ? QUICK_FILTER_LABELS[quickFilter] : `Current stock, with ${MONTH_LABELS[month]} 2026 movement`}
          </h3>
          <div className="flex items-center gap-3">
            {quickFilter && (
              <button onClick={() => setQuickFilter(null)} className="text-[11px] text-teal-400 hover:underline">
                Clear filter ✕
              </button>
            )}
            <span className="text-[11px] text-slate-500">{filtered.length} of {items.length} items</span>
            <button
              onClick={() => downloadCsv(filtered, MONTH_LABELS[month])}
              className="flex items-center gap-1.5 text-[11px] text-teal-400 hover:text-teal-300 border border-teal-500/30 bg-teal-500/10 px-2.5 py-1 rounded-md"
            >
              <Download className="w-3 h-3" /> Download CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#12151c] z-10">
              <tr className="text-left text-slate-500 text-xs uppercase tracking-wider border-b border-[#232733]">
                <th className="px-4 py-2.5 cursor-pointer select-none" onClick={() => toggleSort("code")}>Code{sortArrow("code")}</th>
                <th className="px-4 py-2.5 cursor-pointer select-none" onClick={() => toggleSort("description")}>Item Description{sortArrow("description")}</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">UOM</th>
                <th className="px-4 py-2.5 text-right cursor-pointer select-none" onClick={() => toggleSort("currentStock")}>Current Stock{sortArrow("currentStock")}</th>
                <th className="px-4 py-2.5 text-right cursor-pointer select-none" onClick={() => toggleSort("added")}>Added ({MONTH_LABELS[month]}){sortArrow("added")}</th>
                <th className="px-4 py-2.5 text-right cursor-pointer select-none" onClick={() => toggleSort("usage")}>Usage ({MONTH_LABELS[month]}){sortArrow("usage")}</th>
                <th className="px-4 py-2.5 text-right cursor-pointer select-none" onClick={() => toggleSort("runoutDays")}>Run-out Days{sortArrow("runoutDays")}</th>
                <th className="px-4 py-2.5 text-right">Next Order</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-[#1c2029] hover:bg-white/[0.03]">
                  <td className="px-4 py-2 font-mono text-xs text-slate-400">{r.code}</td>
                  <td className="px-4 py-2">
                    <Link href={`/item/${r.id}`} className="text-teal-400 hover:text-teal-300 hover:underline font-medium">
                      {r.description}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-400 text-xs">{r.category}</td>
                  <td className="px-4 py-2 text-slate-400">{r.uom}</td>
                  <td className="px-4 py-2 text-right font-semibold text-white">{fmt(r.currentStock)}</td>
                  <td className="px-4 py-2 text-right text-emerald-400">{fmt(r.added)}</td>
                  <td className="px-4 py-2 text-right text-rose-400">{fmt(r.usage)}</td>
                  <td className="px-4 py-2 text-right">{r.runoutDays != null ? fmt(r.runoutDays) : "-"}</td>
                  <td className="px-4 py-2 text-right text-[11px] text-slate-400">{r.runoutDate || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">No items match your search.</div>
          )}
        </div>
      </div>
    </div>
  );
}
