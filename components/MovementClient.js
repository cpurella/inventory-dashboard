"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MONTH_KEYS, MONTH_LABELS } from "@/lib/constants";

function fmt(n) {
  if (n === null || n === undefined) return "-";
  return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

export default function MovementClient({ items, categories, defaultMonth }) {
  const [month, setMonth] = useState(defaultMonth);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("usage");
  const [sortDir, setSortDir] = useState("desc");

  const rows = useMemo(() => {
    return items.map((it) => {
      const md = it.months.find((m) => m.month === month) || {
        opening: 0, added: 0, usage: 0, closing: 0,
      };
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
        avgPerDay: it.avgPerDay,
        runoutDays: it.runoutDays,
        runoutDate: it.runoutDate,
      };
    });
  }, [items, month]);

  const filtered = useMemo(() => {
    let list = rows;
    if (category !== "All") list = list.filter((r) => r.category === category);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          String(r.code).toLowerCase().includes(q) ||
          (r.description || "").toLowerCase().includes(q)
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
  }, [rows, search, category, sortBy, sortDir]);

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
      <div className="text-xs text-slate-500">
        Click any item to open its full 12-month movement chart. Sort or filter to find fast-moving or dormant lines.
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <input
          type="text"
          placeholder="Find code or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-80 bg-[#12151c] border border-[#232733] rounded-md px-3 py-1.5 text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
        />
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
        <div className="px-4 py-3 border-b border-[#232733] flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-300">
            Movement report — {MONTH_LABELS[month]} 2026
          </h3>
          <span className="text-[11px] text-slate-500">{filtered.length} of {items.length} items</span>
        </div>
        <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#12151c] z-10">
              <tr className="text-left text-slate-500 text-xs uppercase tracking-wider border-b border-[#232733]">
                <th className="px-4 py-2.5 cursor-pointer select-none" onClick={() => toggleSort("code")}>Code{sortArrow("code")}</th>
                <th className="px-4 py-2.5 cursor-pointer select-none" onClick={() => toggleSort("description")}>Item Description{sortArrow("description")}</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5 text-right cursor-pointer select-none" onClick={() => toggleSort("added")}>Added{sortArrow("added")}</th>
                <th className="px-4 py-2.5 text-right cursor-pointer select-none" onClick={() => toggleSort("usage")}>Usage{sortArrow("usage")}</th>
                <th className="px-4 py-2.5 text-right cursor-pointer select-none" onClick={() => toggleSort("avgPerDay")}>Avg/Day{sortArrow("avgPerDay")}</th>
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
                      {r.description} →
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-400 text-xs">{r.category}</td>
                  <td className="px-4 py-2 text-right text-emerald-400">{fmt(r.added)}</td>
                  <td className="px-4 py-2 text-right text-rose-400">{fmt(r.usage)}</td>
                  <td className="px-4 py-2 text-right">{fmt(r.avgPerDay)}</td>
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
