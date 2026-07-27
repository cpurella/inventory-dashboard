import Link from "next/link";
import { getItemById, cleanNote } from "@/lib/data";
import { MONTH_LABELS } from "@/lib/constants";
import ItemChart from "@/components/ItemChart";

export const dynamic = "force-dynamic";

function fmt(n) {
  if (n === null || n === undefined) return "-";
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function Row({ label, value, valueClass = "text-slate-300", bold = false }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-400">{label}</span>
      <span className={`${valueClass} ${bold ? "font-semibold text-white text-sm" : ""}`}>{value}</span>
    </div>
  );
}

export default async function ItemPage({ params }) {
  const item = await getItemById(params.id);

  if (!item) {
    return (
      <div className="bg-[#12151c] border border-[#232733] rounded-xl p-8 text-center text-slate-300">
        <p className="text-slate-500 mb-3">Item not found.</p>
        <Link href="/" className="text-teal-400 hover:underline">← Back to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-200">
      <Link href="/" className="text-sm text-teal-400 hover:underline">← Back to dashboard</Link>

      <div className="bg-[#12151c] border border-[#232733] rounded-xl p-6">
        <div className="text-xs font-mono text-slate-500">Code: {item.code}</div>
        <h2 className="text-xl font-semibold text-white">{item.description}</h2>
        <div className="text-sm text-slate-500">Unit: {item.uom} · Category: {item.category}</div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
          <div>
            <div className="text-xs text-slate-500">Current Stock</div>
            <div className="text-lg font-semibold text-white">{fmt(item.currentStock)}</div>
            <div className="text-[10px] text-emerald-400">live balance</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Year Added</div>
            <div className="text-lg font-semibold text-emerald-400">{fmt(item.yearTotal.added)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Year Usage</div>
            <div className="text-lg font-semibold text-rose-400">{fmt(item.yearTotal.usage)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Year Damage/Spoilage</div>
            <div className="text-lg font-semibold text-orange-400">{fmt(item.yearTotal.damage)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Run-out in</div>
            <div className="text-lg font-semibold text-teal-400">
              {item.runoutDays != null ? `${fmt(item.runoutDays)} days` : "-"}
            </div>
            {item.runoutDate && <div className="text-xs text-slate-500">({item.runoutDate})</div>}
          </div>
        </div>

        <details className="mt-4 group">
          <summary className="text-xs text-teal-400 cursor-pointer hover:underline list-none flex items-center gap-1">
            <span className="inline-block transition-transform group-open:rotate-90">▸</span>
            How is Current Stock calculated?
          </summary>
          <div className="mt-3 bg-[#0e1117] border border-[#232733] rounded-lg p-4 text-xs space-y-1.5">
            <Row label="January opening balance (from file)" value={fmt(item.calculationBreakdown.janOpening)} />
            <Row label="+ Added — from Excel/file baseline" value={fmt(item.calculationBreakdown.baselineAdded)} valueClass="text-emerald-400" />
            <Row label="− Usage — from Excel/file baseline" value={fmt(item.calculationBreakdown.baselineUsage)} valueClass="text-rose-400" />
            <Row label="− Damage — from Excel/file baseline" value={fmt(item.calculationBreakdown.baselineDamage)} valueClass="text-orange-400" />
            <Row label="+ Added — logged manually (GRN)" value={fmt(item.calculationBreakdown.manualAdded)} valueClass="text-emerald-400" />
            <Row label="− Usage — logged manually" value={fmt(item.calculationBreakdown.manualUsage)} valueClass="text-rose-400" />
            <Row label="− Damage — logged manually" value={fmt(item.calculationBreakdown.manualDamage)} valueClass="text-orange-400" />
            <div className="border-t border-[#232733] pt-1.5 mt-1.5">
              <Row label="= Current Stock" value={`${fmt(item.calculationBreakdown.currentStock)} ${item.uom}`} bold />
            </div>
            <p className="text-[11px] text-slate-500 pt-2">
              If this doesn't look right, check the Monthly Movement table below (file baseline) and the Bin
              Card ledger further down (manual + historical entries) to see exactly which numbers add up to this.
            </p>
          </div>
        </details>
      </div>

      <div className="bg-[#12151c] border border-[#232733] rounded-xl p-6">
        <h3 className="font-medium mb-3 text-slate-300">Monthly Movement — 2026</h3>
        <ItemChart months={item.months} />
      </div>

      <div className="bg-[#12151c] border border-[#232733] rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 text-xs uppercase tracking-wider border-b border-[#232733]">
              <th className="px-5 py-3">Month</th>
              <th className="px-5 py-3 text-right">Opening</th>
              <th className="px-5 py-3 text-right">Added</th>
              <th className="px-5 py-3 text-right">Usage</th>
              <th className="px-5 py-3 text-right">Damage</th>
              <th className="px-5 py-3 text-right">Closing</th>
            </tr>
          </thead>
          <tbody>
            {item.months.map((m) => (
              <tr key={m.month} className="border-b border-[#1c2029]">
                <td className="px-5 py-2.5 text-slate-300">{MONTH_LABELS[m.month]} 2026</td>
                <td className="px-5 py-2.5 text-right">{fmt(m.opening)}</td>
                <td className="px-5 py-2.5 text-right text-emerald-400">{fmt(m.added)}</td>
                <td className="px-5 py-2.5 text-right text-rose-400">{fmt(m.usage)}</td>
                <td className="px-5 py-2.5 text-right text-orange-400">{fmt(m.damage)}</td>
                <td className="px-5 py-2.5 text-right font-semibold text-white">{fmt(m.closing)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-[#12151c] border border-[#232733] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#232733] flex items-center justify-between flex-wrap gap-1">
          <h3 className="font-medium text-slate-300">Bin Card — Transaction Ledger</h3>
          <span className="text-[11px] text-slate-500">
            {item.ledger.length} recorded entries · balance reflects only entries shown below
          </span>
        </div>
        {item.ledger.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No individual transactions recorded for this item yet. Log one in{" "}
            <Link href="/inventory" className="text-teal-400 hover:underline">Inventory Thilafushi</Link>,
            or import bin-card history from the admin menu.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#12151c] z-10">
                <tr className="text-left text-slate-500 text-xs uppercase tracking-wider border-b border-[#232733]">
                  <th className="px-5 py-2.5">Date</th>
                  <th className="px-5 py-2.5">Type</th>
                  <th className="px-5 py-2.5">Location</th>
                  <th className="px-5 py-2.5">Reference / Customer</th>
                  <th className="px-5 py-2.5 text-right">In</th>
                  <th className="px-5 py-2.5 text-right">Out</th>
                  <th className="px-5 py-2.5 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {item.ledger.map((l) => {
                  const locMatch = l.note ? l.note.match(/^\[(.+?)\]\s*(.*)$/) : null;
                  const location = locMatch ? locMatch[1] : null;
                  const noteText = cleanNote(locMatch ? locMatch[2] : l.note);
                  return (
                    <tr key={l.id} className="border-b border-[#1c2029]">
                      <td className="px-5 py-2 text-slate-400 text-xs">{l.date}</td>
                      <td className="px-5 py-2">
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full border ${
                            l.type === "GRN"
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                              : l.type === "DAMAGE"
                              ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                              : "border-sky-500/30 bg-sky-500/10 text-sky-400"
                          }`}
                        >
                          {l.type}
                        </span>
                      </td>
                      <td className="px-5 py-2">
                        {location ? (
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full border ${
                              location === "Thilafushi"
                                ? "border-teal-500/30 bg-teal-500/10 text-teal-400"
                                : "border-violet-500/30 bg-violet-500/10 text-violet-400"
                            }`}
                          >
                            {location}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-5 py-2 text-slate-300 text-xs">{noteText || "-"}</td>
                      <td className="px-5 py-2 text-right text-emerald-400">{l.type === "GRN" ? fmt(l.quantity) : ""}</td>
                      <td className="px-5 py-2 text-right text-rose-400">{l.type !== "GRN" ? fmt(l.quantity) : ""}</td>
                      <td className="px-5 py-2 text-right font-semibold text-white">{fmt(l.balance)} {item.uom}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
