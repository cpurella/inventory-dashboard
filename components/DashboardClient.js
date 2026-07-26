"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from "recharts";
import { Package, AlertTriangle, Clock, Archive, CalendarClock } from "lucide-react";
import { MONTH_KEYS, MONTH_LABELS, BULK_CATEGORIES } from "@/lib/constants";

function fmt(n) {
  if (n === null || n === undefined) return "-";
  return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

const DONUT_COLORS = ["#14b8a6", "#38bdf8", "#a78bfa", "#34d399", "#f472b6", "#fb923c", "#94a3b8", "#4ade80"];

export default function DashboardClient({ items, categories, defaultMonth, locationBreakdown }) {
  const [month, setMonth] = useState(defaultMonth);
  const [category, setCategory] = useState("All");

  // Base rows: real physical stock (currentStock) + the selected month's
  // movement (opening/added/usage/closing) -- used for the stat cards,
  // bulk commodity cards, and category donut below.
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
        runoutDate: it.runoutDate,
      };
    });
  }, [items, month]);

  const categoryFiltered = useMemo(() => {
    if (category === "All") return rows;
    return rows.filter((r) => r.category === category);
  }, [rows, category]);

  // ---- Top stat cards (based on real current stock, not the movement month) ----
  const totalItems = categoryFiltered.length;
  const criticalStockouts = categoryFiltered.filter((r) => r.runoutDays != null && r.runoutDays <= 15).length;
  const reorderNow = categoryFiltered.filter((r) => r.runoutDays != null && r.runoutDays > 15 && r.runoutDays <= 30).length;
  const dormantLines = categoryFiltered.filter((r) => r.currentStock === 0).length;

  // The single most urgent item to reorder within the current filter.
  const nextReorderItem = useMemo(() => {
    const withDates = categoryFiltered.filter((r) => r.runoutDate && r.runoutDays != null);
    if (withDates.length === 0) return null;
    return [...withDates].sort((a, b) => a.runoutDays - b.runoutDays)[0];
  }, [categoryFiltered]);

  // ---- Bulk commodity levels: respects the active category filter.
  // When "All" is selected, show ONE representative (highest-stock) item per
  // true bulk category, so a single category (e.g. Steel) can't dominate all 4 cards.
  // When a specific category is selected, show the top items within it.
  const bulkCommodities = useMemo(() => {
    if (category === "All") {
      return BULK_CATEGORIES
        .map((cat) => {
          const top = rows
            .filter((r) => r.category === cat && r.currentStock > 0)
            .sort((a, b) => b.currentStock - a.currentStock)[0];
          return top || null;
        })
        .filter(Boolean)
        .slice(0, 8);
    }
    return [...categoryFiltered]
      .filter((r) => r.currentStock > 0)
      .sort((a, b) => b.currentStock - a.currentStock)
      .slice(0, 8);
  }, [rows, categoryFiltered, category]);

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

  function catalogueHref(filterKey) {
    const params = new URLSearchParams();
    if (filterKey) params.set("filter", filterKey);
    if (category !== "All") params.set("category", category);
    const qs = params.toString();
    return qs ? `/catalogue?${qs}` : "/catalogue";
  }

  return (
    <div className="space-y-4 text-slate-200">
      <div className="text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" /> Live balance
        </span> · updated instantly as GRN, Usage, and Damage entries are recorded · monthly movement history below can be browsed by month.
      </div>

      {/* Filters row */}
      <div className="flex justify-end">
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
          <label className="text-xs uppercase tracking-wide text-slate-500">Movement Month</label>
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

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard icon={Package} label="TRACKED ITEMS" value={totalItems} sub="Live balance — view full list" href={catalogueHref(null)} />
        <StatCard icon={AlertTriangle} label="CRITICAL STOCK-OUTS" value={criticalStockouts} sub="Run-out within 15 days" accent="rose" href={catalogueHref("critical")} />
        <StatCard icon={Clock} label="REORDER NOW" value={reorderNow} sub="Run-out in 16–30 days" accent="teal" href={catalogueHref("reorder")} />
        <StatCard icon={Archive} label="ZERO STOCK LINES" value={dormantLines} sub="Currently at 0 balance" accent="slate" href={catalogueHref("zero")} />
        <Link
          href={nextReorderItem ? `/item/${nextReorderItem.id}` : "#"}
          className="bg-[#12151c] border border-[#232733] rounded-xl p-3 hover:border-slate-500 transition block"
        >
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500">
            <CalendarClock className="w-3.5 h-3.5" /> Next Reorder Due
          </div>
          {nextReorderItem ? (
            <>
              <div className="text-sm font-semibold text-white mt-1.5 truncate" title={nextReorderItem.description}>
                {nextReorderItem.description}
              </div>
              <div className="text-[11px] text-teal-400 mt-0.5">
                {nextReorderItem.runoutDate} · {fmt(nextReorderItem.runoutDays)} days
              </div>
            </>
          ) : (
            <div className="text-sm text-slate-500 mt-2">No data</div>
          )}
        </Link>
      </div>

      {/* Bulk commodities + donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 bg-[#12151c] border border-[#232733] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-300">
              {category === "All" ? "Bulk commodity levels" : `Top items — ${category}`}
            </h3>
            {category === "All" && (
              <span className="text-[11px] text-slate-500 uppercase tracking-wider">{BULK_CATEGORIES.join(" · ")}</span>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {bulkCommodities.map((c) => (
              <Link
                key={c.id}
                href={`/item/${c.id}`}
                className="block border border-[#232733] rounded-lg p-3 bg-[#0e1117] hover:border-teal-500/40 hover:bg-[#12161f] transition cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-7 h-7 rounded bg-teal-500/15 text-teal-400 flex items-center justify-center text-[10px] font-bold">
                    {c.uom.trim().slice(0, 2)}
                  </div>
                  <span className="text-[9px] uppercase tracking-wide text-slate-500">{c.category}</span>
                </div>
                <div className="text-xs text-slate-400 truncate" title={c.description}>
                  {c.description}
                </div>
                <div className="text-lg font-semibold text-white mt-1">
                  {fmt(c.currentStock)} <span className="text-xs text-slate-500">{c.uom}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {c.runoutDays != null ? `${fmt(c.runoutDays)}d left · reorder ${c.runoutDate}` : "no draw data"}
                </div>
              </Link>
            ))}
            {bulkCommodities.length === 0 && (
              <div className="col-span-4 text-sm text-slate-500 py-6 text-center">
                No stock to show for this filter.
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#12151c] border border-[#232733] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-300">Stock concentration</h3>
            <span className="text-[11px] text-slate-500 uppercase tracking-wider">By category</span>
          </div>
          <div className="h-40">
            {categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={42}
                    outerRadius={64}
                    paddingAngle={2}
                  >
                    {categoryBreakdown.map((entry, i) => (
                      <Cell key={entry.name} fill={DONUT_COLORS[i % DONUT_COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#12151c", border: "1px solid #232733", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "#e5e7eb" }}
                    itemStyle={{ color: "#e5e7eb" }}
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
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
            {categoryBreakdown.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1 text-[10px] text-slate-400">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sand & Aggregate — by location, per item */}
      {locationBreakdown && locationBreakdown.length > 0 && (
        <div className="bg-[#12151c] border border-[#232733] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#232733] flex items-center justify-between flex-wrap gap-1">
            <h3 className="text-sm font-medium text-slate-300">Sand &amp; Aggregate — by location</h3>
            <span className="text-[11px] text-slate-500">Received/issued totals from bin-card history — not a per-location balance</span>
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#12151c] z-10">
                <tr className="text-left text-slate-500 text-xs uppercase tracking-wider border-b border-[#232733]">
                  <th className="px-4 py-2.5">Item</th>
                  <th className="px-4 py-2.5 text-right">
                    <span className="text-teal-400">Thilafushi</span> Received
                  </th>
                  <th className="px-4 py-2.5 text-right">
                    <span className="text-teal-400">Thilafushi</span> Issued
                  </th>
                  <th className="px-4 py-2.5 text-right">
                    <span className="text-violet-400">Mamigili</span> Received
                  </th>
                  <th className="px-4 py-2.5 text-right">
                    <span className="text-violet-400">Mamigili</span> Issued
                  </th>
                </tr>
              </thead>
              <tbody>
                {locationBreakdown.map((row) => (
                  <tr key={row.itemId} className="border-b border-[#1c2029] hover:bg-white/[0.03]">
                    <td className="px-4 py-2">
                      <Link href={`/item/${row.itemId}`} className="text-teal-400 hover:underline">
                        {row.description}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-right text-emerald-400">{fmt(row.Thilafushi.received)}</td>
                    <td className="px-4 py-2 text-right text-rose-400">{fmt(row.Thilafushi.issued)}</td>
                    <td className="px-4 py-2 text-right text-emerald-400">{fmt(row.Mamigili.received)}</td>
                    <td className="px-4 py-2 text-right text-rose-400">{fmt(row.Mamigili.issued)}</td>
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

function StatCard({ icon: Icon, label, value, sub, accent = "default", onClick, active, href }) {
  const accentClass = {
    default: "text-white",
    rose: "text-rose-400",
    teal: "text-teal-400",
    slate: "text-slate-300",
  }[accent];

  const className = `text-left bg-[#12151c] border rounded-xl p-3 transition hover:border-slate-500 block ${
    active ? "border-teal-500/60 ring-1 ring-teal-500/30" : "border-[#232733]"
  }`;

  const content = (
    <>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500">
        {Icon && <Icon className="w-3.5 h-3.5" />} {label}
      </div>
      <div className={`text-2xl font-semibold mt-1.5 ${accentClass}`}>{fmt(value)}</div>
      <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>
    </>
  );

  if (href) {
    return <Link href={href} className={className}>{content}</Link>;
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}
