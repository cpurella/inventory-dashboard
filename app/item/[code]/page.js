import Link from "next/link";
import { getAllItems, getItemByCode } from "../../../lib/data";
import ItemChart from "../../../components/ItemChart";

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

// Pre-render a page for every item code at build time.
export function generateStaticParams() {
  const items = getAllItems();
  return items.map((it) => ({ code: String(it.code) }));
}

export default function ItemPage({ params }) {
  const item = getItemByCode(params.code);

  if (!item) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
        <p className="text-slate-500">Item not found.</p>
        <Link href="/" className="text-blue-600 hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        ← Back to dashboard
      </Link>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="text-xs font-mono text-slate-400">{item.code}</div>
        <h2 className="text-xl font-semibold">{item.description}</h2>
        {item.subDetail && (
          <div className="text-sm text-slate-500">{item.subDetail}</div>
        )}
        <div className="text-sm text-slate-500">Unit: {item.uom}</div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
          <div>
            <div className="text-xs text-slate-400">Year Opening</div>
            <div className="text-lg font-semibold">{fmt(item.yearTotal.opening)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Year Added</div>
            <div className="text-lg font-semibold text-emerald-600">
              {fmt(item.yearTotal.added)}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Year Usage</div>
            <div className="text-lg font-semibold text-rose-600">
              {fmt(item.yearTotal.usage)}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Current Closing</div>
            <div className="text-lg font-semibold">{fmt(item.yearTotal.closing)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Run-out in</div>
            <div className="text-lg font-semibold">
              {item.runoutDays != null ? `${fmt(item.runoutDays)} days` : "-"}
            </div>
            {item.runoutDate && (
              <div className="text-xs text-slate-400">({item.runoutDate})</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="font-medium mb-3">Monthly Movement — 2026</h3>
        <ItemChart months={item.months} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-slate-600 border-b">
              <th className="px-4 py-3">Month</th>
              <th className="px-4 py-3 text-right">Opening</th>
              <th className="px-4 py-3 text-right">Added</th>
              <th className="px-4 py-3 text-right">Usage</th>
              <th className="px-4 py-3 text-right">Closing</th>
            </tr>
          </thead>
          <tbody>
            {item.months.map((m) => (
              <tr key={m.month} className="border-b">
                <td className="px-4 py-2">{MONTH_LABELS[m.month]} 2026</td>
                <td className="px-4 py-2 text-right">{fmt(m.opening)}</td>
                <td className="px-4 py-2 text-right text-emerald-600">{fmt(m.added)}</td>
                <td className="px-4 py-2 text-right text-rose-600">{fmt(m.usage)}</td>
                <td className="px-4 py-2 text-right font-semibold">{fmt(m.closing)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
