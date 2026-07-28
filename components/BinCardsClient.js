"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, BookOpen, Download } from "lucide-react";

function fmt(n) {
  if (n === null || n === undefined) return "-";
  return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

export default function BinCardsClient({ items, categories }) {
  const [category, setCategory] = useState(categories[0] || "All");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = items.filter((it) => it.category === category);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (it) =>
          String(it.code).toLowerCase().includes(q) ||
          (it.description || "").toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => a.description.localeCompare(b.description));
  }, [items, category, search]);

  // Count of categories, for the pill row.
  const categoryCounts = useMemo(() => {
    const counts = {};
    for (const it of items) counts[it.category] = (counts[it.category] || 0) + 1;
    return counts;
  }, [items]);

  return (
    <div className="space-y-4 text-[var(--text-primary)]">
      <div className="text-xs text-[var(--text-muted)]">
        Browse Bin Cards by category — pick a category, then open any item to see its full
        receipt / issue ledger with running balance.
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`text-xs px-3 py-1.5 rounded-full border transition ${
              category === c
                ? "border-teal-500/50 bg-teal-500/10 text-teal-400"
                : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--hover-overlay)]"
            }`}
          >
            {c} <span className="text-[var(--text-muted)]">({categoryCounts[c] || 0})</span>
          </button>
        ))}
      </div>

      {/* Search within category */}
      <div className="relative w-full md:w-80">
        <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder={`Find in ${category}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-md pl-9 pr-3 py-1.5 text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
        />
      </div>

      {/* Item list for the selected category */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-medium text-[var(--text-primary)]">{category}</h3>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[var(--text-muted)]">{filtered.length} items</span>
            <a
              href={`/api/bincards/export?category=${encodeURIComponent(category)}`}
              className="flex items-center gap-1.5 text-[11px] text-teal-400 hover:text-teal-300 border border-teal-500/30 bg-teal-500/10 px-2.5 py-1 rounded-md"
            >
              <Download className="w-3 h-3" /> Download {category} as Excel
            </a>
          </div>
        </div>
        <div className="max-h-[600px] overflow-y-auto divide-y divide-[var(--border-subtle)]">
          {filtered.map((it) => (
            <Link
              key={it.id}
              href={`/item/${it.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-[var(--hover-overlay)] transition"
            >
              <div className="min-w-0">
                <div className="text-sm text-[var(--text-primary)] truncate">{it.description}</div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  {it.code} · Current: {fmt(it.currentStock)} {it.uom}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-teal-400 text-xs shrink-0 ml-3">
                <BookOpen className="w-3.5 h-3.5" /> Bin Card
              </div>
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-[var(--text-muted)] text-sm">No items match.</div>
          )}
        </div>
      </div>
    </div>
  );
}
