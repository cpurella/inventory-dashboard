"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const MONTH_LABELS = {
  "2026-01": "Jan",
  "2026-02": "Feb",
  "2026-03": "Mar",
  "2026-04": "Apr",
  "2026-05": "May",
  "2026-06": "Jun",
  "2026-07": "Jul",
  "2026-08": "Aug",
  "2026-09": "Sep",
  "2026-10": "Oct",
  "2026-11": "Nov",
  "2026-12": "Dec",
};

function fmt(n) {
  if (n === null || n === undefined) return "-";
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function DashboardClient({ items }) {
  const monthKeys = Object.keys(MONTH_LABELS);
  const [month, setMonth] = useState(monthKeys[monthKeys.length - 1]); // default: latest month (Dec)
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("closing");
  const [sortDir, setSortDir] = useState("desc");

  // Build a flat row per item for the selected month
  const rows = useMemo(() => {
    return items.map((it) => {
      const md = it.months.find((m) => m.month === month) || {
        opening: 0,
        added: 0,
        usage: 0,
        closing: 0,
      };
      return {
        code: it.code,
        description: it.description,
        uom: it.uom,
        opening: md.opening,
        added: md.added,
        usage: md.usage,
        closing: md.closing,
        runoutDays: it.runoutDays,
      };
    });
  }, [items, month]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows;
    if (q) {
      list = rows.filter(
        (r) =>
          String(r.code).toLowerCase().includes(q) ||
          (r.description || "").toLowerCase().includes(q)
      );
    }
    const sorted = [...list].sort((a, b) => {
      let va = a[sortBy];
      let vb = b[sortBy];
      if (typeof va === "string") va = va.toLowerCase();
      if (typeof vb === "string") vb = vb.toLowerCase();
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [rows, search, sortBy, sortDir]);

  // Summary cards grouped by UOM for the selected month
  const summaryByUom = useMemo(() => {
    const byUom = {};
    for (const r of rows) {
      if (!byUom[r.uom]) {
        byUom[r.uom] = { uom: r.uom, opening: 0, added: 0, usage: 0, closing: 0, count: 0 };
      }
      byUom[r.uom].opening += r.opening;
      byUom[r.uom].added += r.added;
      byUom[r.uom].usage += r.usage;
      byUom[r.uom].closing += r.closing;
      byUom[r.uom].count += 1;
    }
    return Object.values(byUom).sort((a, b) => b.closing - a.closing);
  }, [rows]);

  function toggleSort(col) {
    if (sortBy === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
  }

  function sortArrow(col) {
    if (sortBy !== col) return "";
    return sortDir === "asc" ? " ▲" : " ▼";
  }

  const totalItems = items.length;

  return (
    <div className="space-y-6">
      {/* Top controls */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600">Month:</label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm bg-white shadow-sm"
          >
            {monthKeys.map((mk) => (
              <option key={mk} value={mk}>
                {MONTH_LABELS[mk]} 2026
              </option>
            ))}
          </select>
        </div>
        <input
          type="text"
          placeholder="Search item code or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm w-full md:w-80 bg-white shadow-sm"
        />
      </div>

      {/* Summary cards */}
      <div>
        <div className="text-sm text-slate-500 mb-2">
          Overall balance summary for {MONTH_LABELS[month]} 2026 — grouped by unit
          (UOM), since items use different measurement units. Total items tracked:{" "}
          <strong>{totalItems}</strong>.
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summaryByUom.slice(0, 8).map((s) => (
            <div key={s.uom} className="bg-white rounded-xl shadow-sm p-4 border">
              <div className="text-xs uppercase tracking-wide text-slate-400">
                {s.uom} ({s.count} items)
              </div>
              <div className="text-2xl font-semibold mt-1">{fmt(s.closing)}</div>
              <div className="text-xs text-slate-500 mt-1">
                Closing balance · Usage this month: {fmt(s.usage)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-slate-600 border-b">
              <th className="px-4 py-3 cursor-pointer select-none" onClick={() => toggleSort("code")}>
                Code{sortArrow("code")}
              </th>
              <th className="px-4 py-3 cursor-pointer select-none" onClick={() => toggleSort("description")}>
                Item Description{sortArrow("description")}
              </th>
              <th className="px-4 py-3">UOM</th>
              <th className="px-4 py-3 text-right cursor-pointer select-none" onClick={() => toggleSort("opening")}>
                Opening{sortArrow("opening")}
              </th>
              <th className="px-4 py-3 text-right cursor-pointer select-none" onClick={() => toggleSort("added")}>
                Added{sortArrow("added")}
              </th>
              <th className="px-4 py-3 text-right cursor-pointer select-none" onClick={() => toggleSort("usage")}>
                Usage{sortArrow("usage")}
              </th>
              <th className="px-4 py-3 text-right cursor-pointer select-none" onClick={() => toggleSort("closing")}>
                Closing{sortArrow("closing")}
              </th>
              <th className="px-4 py-3 text-right cursor-pointer select-none" onClick={() => toggleSort("runoutDays")}>
                Run-out Days{sortArrow("runoutDays")}
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.code} className="border-b hover:bg-slate-50">
                <td className="px-4 py-2 font-mono text-xs">{r.code}</td>
                <td className="px-4 py-2">
                  <Link
                    href={`/item/${r.code}`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {r.description}
                  </Link>
                </td>
                <td className="px-4 py-2">{r.uom}</td>
                <td className="px-4 py-2 text-right">{fmt(r.opening)}</td>
                <td className="px-4 py-2 text-right text-emerald-600">{fmt(r.added)}</td>
                <td className="px-4 py-2 text-right text-rose-600">{fmt(r.usage)}</td>
                <td className="px-4 py-2 text-right font-semibold">{fmt(r.closing)}</td>
                <td className="px-4 py-2 text-right">
                  {r.runoutDays != null ? fmt(r.runoutDays) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-6 text-center text-slate-400">No items found.</div>
        )}
      </div>
    </div>
  );
}
