"use client";

import {
  ResponsiveContainer, ComposedChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { MONTH_LABELS } from "@/lib/constants";

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
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="name" fontSize={12} stroke="var(--text-muted)" />
          <YAxis fontSize={12} stroke="var(--text-muted)" />
          <Tooltip
            contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--text-primary)" }}
            labelStyle={{ color: "var(--text-primary)", fontWeight: 600, marginBottom: 4 }}
            itemStyle={{ color: "var(--text-primary)" }}
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }} />
          <Bar dataKey="Added" fill="#34d399" barSize={18} />
          <Bar dataKey="Usage" fill="#fb7185" barSize={18} />
          <Line type="monotone" dataKey="Closing" stroke="#14b8a6" strokeWidth={2} dot={{ r: 3 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
