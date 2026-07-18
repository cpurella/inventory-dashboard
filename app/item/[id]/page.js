import Link from "next/link";
import { getItemById } from "../../../lib/data";
import { MONTH_LABELS } from "../../../lib/constants";
import ItemChart from "../../../components/ItemChart";

export const dynamic = "force-dynamic";

function fmt(n) {
  if (n === null || n === undefined) return "-";
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default async function ItemPage({ params }) {
  const item = await getItemById(params.id);

  if (!item) {
    return (
      <div className="bg-[#12151c] border border-[#232733] rounded-xl p-8 text-center text-slate-300">
        <p className="text-slate-500 mb-3">Item not found.</p>
        <Link href="/" className="text-amber-400 hover:underline">← Back to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-200">
      <Link href="/" className="text-sm text-amber-400 hover:underline">← Back to dashboard</Link>

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
            <div className="text-lg font-semibold text-amber-400">
              {item.runoutDays != null ? `${fmt(item.runoutDays)} days` : "-"}
            </div>
            {item.runoutDate && <div className="text-xs text-slate-500">({item.runoutDate})</div>}
          </div>
        </div>
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
    </div>
  );
}
