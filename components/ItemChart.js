"use client";

import {
  ResponsiveContainer, ComposedChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { MONTH_LABELS } from "../lib/constants";

export default function ItemChart({ months }) {
  const data = months.map((m) => ({
    name: MONTH_LABELS[m.month] || m.month,
    Added: m.added,
    Usage: m.usage,
    Closing: m.closing,
  }));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#232733" />
          <XAxis dataKey="name" fontSize={12} stroke="#64748b" />
          <YAxis fontSize={12} stroke="#64748b" />
          <Tooltip contentStyle={{ background: "#12151c", border: "1px solid #232733", borderRadius: 8, fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
          <Bar dataKey="Added" fill="#34d399" barSize={18} />
          <Bar dataKey="Usage" fill="#fb7185" barSize={18} />
          <Line type="monotone" dataKey="Closing" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
