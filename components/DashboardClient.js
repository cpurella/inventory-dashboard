"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from "recharts";
import { MONTH_KEYS, MONTH_LABELS, STOCK_AS_OF, BULK_CATEGORIES } from "../lib/data";

function fmt(n) {
  if (n === null || n === undefined) return "-";
  return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

const DONUT_COLORS = ["#f59e0b", "#38bdf8", "#a78bfa", "#34d399", "#f472b6", "#fb923c", "#94a3b8", "#4ade80"];

export default function DashboardClient({ items, categories, defaultMonth }) {
  const [month, setMonth] = useState(defaultMonth);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("currentStock");
  const [sortDir, setSortDir] = useState("desc");

  // Base rows: real physical stock (currentStock, as of STOCK_AS_OF) + the
  // selected month's movement (opening/added/usage/closing) for history.
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
        runoutDays: it.runoutDays,
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
  }, [categoryFiltered, search, sortBy, sortDir]);

  function toggleSort(col) {
    if (sortBy === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("desc"); }
  }
  function sortArrow(col) {
    if (sortBy !== col) return "";
    return sortDir === "asc" ? " ▲" : " ▼";
  }

  // ---- Top stat cards (based on real current stock, not the movement month) ----
  const totalItems = categoryFiltered.length;
  const criticalStockouts = categoryFiltered.filter((r) => r.runoutDays != null && r.runoutDays <= 15).length;
  const reorderNow = categoryFiltered.filter((r) => r.runoutDays != null && r.runoutDays > 15 && r.runoutDays <= 30).length;
  const dormantLines = categoryFiltered.filter((r) => r.currentStock === 0).length;

  // ---- Bulk commodity levels: real bulk categories, sorted by current stock ----
  const bulkCommodities = useMemo(() => {
    return [...rows]
      .filter((r) => BULK_CATEGORIES.includes(r.category) && r.currentStock > 0)
      .sort((a, b) => b.currentStock - a.currentStock)
      .slice(0, 4);
  }, [rows]);

  // ---- Stock concentration donut: current stock share by category ----
  const categoryBreakdown = useMemo(() => {
    const byCat = {};
    for (const r of categoryFiltered) {
      if (!byCat[r.category]) byCat[r.category] = 0;
      byCat[r.category] += r.currentStock;
    }
    return Object.entries(byCat)
      .map(([name, value]) => ({ name, value }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [categoryFiltered]);

  return (
    <div className="space-y-6 text-slate-200">
      <div className="text-xs text-slate-500">
        Physical stock balance as of <span className="text-slate-300">{STOCK_AS_OF}</span> · monthly movement history below is separate and can be browsed by month.
      </div>

      {/* Search + filters row */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <input
          type="text"
          placeholder="Find code or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-80 bg-[#12151c] border border-[#232733] rounded-md px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
        />
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs uppercase tracking-wide text-slate-500">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-[#12151c] border border-[#232733] rounded-md px-3 py-2 text-sm"
          >
            <option value="All">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <label className="text-xs uppercase tracking-wide text-slate-500">Movement Month</label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-[#12151c] border border-[#232733] rounded-md px-3 py-2 text-sm"
          >
            {MONTH_KEYS.map((mk) => (
              <option key={mk} value={mk}>{MONTH_LABELS[mk]} 2026</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="TRACKED ITEMS" value={totalItems} sub={`As of ${STOCK_AS_OF}`} />
        <StatCard label="CRITICAL STOCK-OUTS" value={criticalStockouts} sub="Run-out within 15 days" accent="rose" />
        <StatCard label="REORDER NOW" value={reorderNow} sub="Run-out in 16–30 days" accent="amber" />
        <StatCard label="ZERO STOCK LINES" value={dormantLines} sub="Currently at 0 balance" accent="slate" />
      </div>

      {/* Bulk commodities + donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-[#12151c] border border-[#232733] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-300">Bulk commodity levels</h3>
            <span className="text-[11px] text-slate-500 uppercase tracking-wider">Cement · LPG · Fuel · Aggregate · Steel · Sands</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {bulkCommodities.map((c) => (
              <div key={c.id} className="border border-[#232733] rounded-lg p-3 bg-[#0e1117]">
                <div className="w-8 h-8 rounded bg-amber-500/15 text-amber-400 flex items-center justify-center text-xs font-bold mb-2">
                  {c.uom.trim().slice(0, 2)}
                </div>
                <div className="text-xs text-slate-400 truncate" title={c.description}>
                  {c.description}
                </div>
                <div className="text-lg font-semibold text-white mt-1">
                  {fmt(c.currentStock)} <span className="text-xs text-slate-500">{c.uom}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {c.runoutDays != null ? `${fmt(c.runoutDays)} days at average draw` : "no draw data"}
                </div>
              </div>
            ))}
            {bulkCommodities.length === 0 && (
              <div className="col-span-4 text-sm text-slate-500 py-6 text-center">
                No bulk-category stock to show for this filter.
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#12151c] border border-[#232733] rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-300">Stock concentration</h3>
            <span className="text-[11px] text-slate-500 uppercase tracking-wider">By category</span>
          </div>
          <div className="h-52">
            {categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {categoryBreakdown.map((entry, i) => (
                      <Cell key={entry.name} fill={DONUT_COLORS[i % DONUT_COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#12151c", border: "1px solid #232733", borderRadius: 8, fontSize: 12 }}
                    formatter={(value, name) => [fmt(value), name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-500">
                No data for this filter
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            {categoryBreakdown.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1 text-[11px] text-slate-400">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Item table */}
      <div id="catalogue" className="bg-[#12151c] border border-[#232733] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#232733] flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-300">
            Master catalogue — current stock, with {MONTH_LABELS[month]} 2026 movement
          </h3>
          <span className="text-[11px] text-slate-500">{filtered.length} of {items.length} items</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 text-xs uppercase tracking-wider border-b border-[#232733]">
                <th className="px-5 py-3 cursor-pointer select-none" onClick={() => toggleSort("code")}>Code{sortArrow("code")}</th>
                <th className="px-5 py-3 cursor-pointer select-none" onClick={() => toggleSort("description")}>Item Description{sortArrow("description")}</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">UOM</th>
                <th className="px-5 py-3 text-right cursor-pointer select-none" onClick={() => toggleSort("currentStock")}>Current Stock{sortArrow("currentStock")}</th>
                <th className="px-5 py-3 text-right cursor-pointer select-none" onClick={() => toggleSort("added")}>Added ({MONTH_LABELS[month]}){sortArrow("added")}</th>
                <th className="px-5 py-3 text-right cursor-pointer select-none" onClick={() => toggleSort("usage")}>Usage ({MONTH_LABELS[month]}){sortArrow("usage")}</th>
                <th className="px-5 py-3 text-right cursor-pointer select-none" onClick={() => toggleSort("runoutDays")}>Run-out Days{sortArrow("runoutDays")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-[#1c2029] hover:bg-white/[0.03]">
                  <td className="px-5 py-2.5 font-mono text-xs text-slate-400">{r.code}</td>
                  <td className="px-5 py-2.5">
                    <Link href={`/item/${r.id}`} className="text-amber-400 hover:text-amber-300 hover:underline font-medium">
                      {r.description}
                    </Link>
                  </td>
                  <td className="px-5 py-2.5 text-slate-400 text-xs">{r.category}</td>
                  <td className="px-5 py-2.5 text-slate-400">{r.uom}</td>
                  <td className="px-5 py-2.5 text-right font-semibold text-white">{fmt(r.currentStock)}</td>
                  <td className="px-5 py-2.5 text-right text-emerald-400">{fmt(r.added)}</td>
                  <td className="px-5 py-2.5 text-right text-rose-400">{fmt(r.usage)}</td>
                  <td className="px-5 py-2.5 text-right">{r.runoutDays != null ? fmt(r.runoutDays) : "-"}</td>
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

function StatCard({ label, value, sub, accent = "default" }) {
  const accentClass = {
    default: "text-white",
    rose: "text-rose-400",
    amber: "text-amber-400",
    slate: "text-slate-300",
  }[accent];

  return (
    <div className="bg-[#12151c] border border-[#232733] rounded-xl p-4">
      <div className="text-[11px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`text-3xl font-semibold mt-2 ${accentClass}`}>{fmt(value)}</div>
      <div className="text-[11px] text-slate-500 mt-1">{sub}</div>
    </div>
  );
}
