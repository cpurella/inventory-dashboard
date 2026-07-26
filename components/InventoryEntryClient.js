"use client";

import { useEffect, useRef, useState } from "react";
import { Search, PackagePlus, PackageMinus, AlertOctagon, Check, Pencil, Trash2, X, PlusCircle, Download } from "lucide-react";
import Modal from "@/components/Modal";

const TABS = [
  { key: "GRN", label: "Received (GRN)", icon: PackagePlus, color: "emerald" },
  { key: "USAGE", label: "Usage / Consumption", icon: PackageMinus, color: "sky" },
  { key: "DAMAGE", label: "Damage / Spoilage", icon: AlertOctagon, color: "rose" },
];

const COLOR_CLASSES = {
  emerald: { bg: "bg-emerald-500", text: "text-emerald-400", ring: "border-emerald-500/30 bg-emerald-500/10" },
  sky: { bg: "bg-sky-500", text: "text-sky-400", ring: "border-sky-500/30 bg-sky-500/10" },
  rose: { bg: "bg-rose-500", text: "text-rose-400", ring: "border-rose-500/30 bg-rose-500/10" },
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function fmt(n) {
  if (n === null || n === undefined) return "-";
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function downloadEntriesCsv(rows) {
  const header = ["Date", "Type", "Code", "Item", "Quantity", "UOM", "Note"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push([
      r.date,
      r.type,
      r.code,
      `"${(r.description || "").replace(/"/g, '""')}"`,
      r.quantity,
      r.uom,
      `"${(r.note || "").replace(/"/g, '""')}"`,
    ].join(","));
  }
  const csv = lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inventory-entries-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function InventoryEntryClient({ initialRecent, canEdit = true }) {
  const [activeTab, setActiveTab] = useState("GRN");
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [recent, setRecent] = useState(initialRecent || []);
  const [editingId, setEditingId] = useState(null);
  const [editQty, setEditQty] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editNote, setEditNote] = useState("");
  const [rowBusy, setRowBusy] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const searchTimer = useRef(null);

  const tab = TABS.find((t) => t.key === activeTab);
  const colors = COLOR_CLASSES[tab.color];

  useEffect(() => {
    if (!query.trim()) {
      setMatches([]);
      return;
    }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/items/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setMatches(data.items || []);
      } catch {
        setMatches([]);
      }
    }, 250);
    return () => clearTimeout(searchTimer.current);
  }, [query]);

  function pickItem(it) {
    setSelectedItem(it);
    setQuery("");
    setMatches([]);
  }

  function startEdit(r) {
    setEditingId(r.id);
    setEditQty(String(r.quantity));
    setEditDate(r.date);
    setEditNote(r.note || "");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(r) {
    if (!editQty || Number(editQty) <= 0) {
      alert("Quantity must be greater than 0.");
      return;
    }
    setRowBusy(r.id);
    try {
      const res = await fetch(`/api/transactions/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: Number(editQty), date: editDate, note: editNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed.");
      setRecent((prev) =>
        prev.map((x) =>
          x.id === r.id ? { ...x, quantity: Number(editQty), date: editDate, note: editNote } : x
        )
      );
      if (selectedItem && selectedItem.id === r.itemId) {
        setSelectedItem((s) => ({ ...s, currentStock: data.currentStock }));
      }
      setEditingId(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setRowBusy(null);
    }
  }

  async function deleteEntry(r) {
    if (!window.confirm(`Delete this ${r.type} entry for "${r.description}" (${fmt(r.quantity)} ${r.uom})? This cannot be undone.`)) {
      return;
    }
    setRowBusy(r.id);
    try {
      const res = await fetch(`/api/transactions/${r.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed.");
      setRecent((prev) => prev.filter((x) => x.id !== r.id));
      if (selectedItem && selectedItem.id === r.itemId) {
        setSelectedItem((s) => ({ ...s, currentStock: data.currentStock }));
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setRowBusy(null);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedItem || !quantity || Number(quantity) <= 0) {
      setMessage({ ok: false, text: "Pick an item and enter a quantity greater than 0." });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: selectedItem.id,
          type: activeTab,
          quantity: Number(quantity),
          date,
          note: note || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save this entry.");

      setMessage({
        ok: true,
        text: `Saved. ${selectedItem.description} — new balance: ${fmt(data.currentStock)} ${selectedItem.uom}.`,
      });
      setRecent((prev) => [
        {
          id: data.transaction.id,
          itemId: selectedItem.id,
          code: selectedItem.code,
          description: selectedItem.description,
          uom: selectedItem.uom,
          type: activeTab,
          quantity: Number(quantity),
          date,
          note,
        },
        ...prev,
      ].slice(0, 30));
      setQuantity("");
      setNote("");
      setSelectedItem({ ...selectedItem, currentStock: data.currentStock });
    } catch (err) {
      setMessage({ ok: false, text: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 text-slate-200">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-xs text-slate-500">
          Log items received, used, or damaged/spoiled — the dashboard balance updates immediately.
        </div>
        {canEdit && (
          <button
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-1.5 text-sm bg-teal-500 text-black font-medium px-3 py-1.5 rounded-md hover:bg-teal-400"
          >
            <PlusCircle className="w-4 h-4" /> Add Entry
          </button>
        )}
      </div>

      {canEdit && (
      <Modal open={formOpen} onClose={() => setFormOpen(false)}>
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-2 flex-wrap">
            {TABS.map((t) => {
              const c = COLOR_CLASSES[t.color];
              const Icon = t.icon;
              const active = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => { setActiveTab(t.key); setMessage(null); }}
                  className={`flex items-center gap-2 text-sm px-3 py-2 rounded-md border transition ${
                    active ? c.ring + " " + c.text : "border-[#232733] text-slate-400 hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" /> {t.label}
                </button>
              );
            })}
          </div>

          {/* Entry form */}
          <form onSubmit={handleSubmit} className="bg-[#12151c] border border-[#232733] rounded-xl p-5 space-y-4">
        <div>
          <label className="text-xs uppercase tracking-wide text-slate-500 block mb-1">Item</label>
          {selectedItem ? (
            <div className="flex items-center justify-between bg-[#0e1117] border border-[#232733] rounded-md px-3 py-2">
              <div>
                <div className="text-sm text-white">{selectedItem.description}</div>
                <div className="text-[11px] text-slate-500">
                  {selectedItem.code} · {selectedItem.category} · Current: {fmt(selectedItem.currentStock)} {selectedItem.uom}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="text-xs text-teal-400 hover:underline"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type item code or name to search..."
                className="w-full bg-[#0e1117] border border-[#232733] rounded-md pl-9 pr-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
              />
              {matches.length > 0 && (
                <div className="absolute z-20 mt-1 w-full bg-[#12151c] border border-[#232733] rounded-md shadow-lg max-h-64 overflow-y-auto">
                  {matches.map((it) => (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => pickItem(it)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 border-b border-[#1c2029] last:border-b-0"
                    >
                      <div className="text-slate-200">{it.description}</div>
                      <div className="text-[11px] text-slate-500">
                        {it.code} · {it.category} · current: {fmt(it.currentStock)} {it.uom}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-500 block mb-1">
              Quantity {selectedItem ? `(${selectedItem.uom})` : ""}
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-[#0e1117] border border-[#232733] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal-500/50"
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-500 block mb-1">Date</label>
            <input
              type="date"
              value={date}
              min="2026-01-01"
              max="2026-12-31"
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#0e1117] border border-[#232733] rounded-md px-3 py-2 text-sm [color-scheme:dark] focus:outline-none focus:border-teal-500/50"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-500 block mb-1">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={activeTab === "DAMAGE" ? "Reason for damage/spoilage..." : "e.g. supplier / job reference"}
              className="w-full bg-[#0e1117] border border-[#232733] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal-500/50"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`${colors.bg} text-black text-sm font-medium px-4 py-2 rounded-md hover:opacity-90 disabled:opacity-50 flex items-center gap-2`}
        >
          <Check className="w-4 h-4" />
          {submitting ? "Saving..." : `Save ${tab.label} Entry`}
        </button>

        {message && (
          <div className={`text-sm rounded-md p-3 ${message.ok ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
            {message.text}
          </div>
        )}
      </form>
        </div>
      </Modal>
      )}

      {/* Recent entries log */}
      <div className="bg-[#12151c] border border-[#232733] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#232733] flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-300">Recent Entries</h3>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-500">Edit or delete a mistaken entry anytime — the balance recalculates automatically.</span>
            <button
              onClick={() => downloadEntriesCsv(recent)}
              className="flex items-center gap-1.5 text-[11px] text-teal-400 hover:text-teal-300 border border-teal-500/30 bg-teal-500/10 px-2.5 py-1 rounded-md shrink-0"
            >
              <Download className="w-3 h-3" /> Download CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#12151c] z-10">
              <tr className="text-left text-slate-500 text-xs uppercase tracking-wider border-b border-[#232733]">
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Item</th>
                <th className="px-4 py-2.5 text-right">Quantity</th>
                <th className="px-4 py-2.5">Note</th>
                {canEdit && <th className="px-4 py-2.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => {
                const t = TABS.find((x) => x.key === r.type);
                const c = COLOR_CLASSES[t?.color || "sky"];
                const isEditing = editingId === r.id;
                const busy = rowBusy === r.id;
                return (
                  <tr key={r.id} className="border-b border-[#1c2029]">
                    <td className="px-4 py-2 text-slate-400 text-xs">
                      {isEditing ? (
                        <input
                          type="date"
                          value={editDate}
                          min="2026-01-01"
                          max="2026-12-31"
                          onChange={(e) => setEditDate(e.target.value)}
                          className="bg-[#0e1117] border border-[#232733] rounded px-1.5 py-1 text-xs w-32 [color-scheme:dark]"
                        />
                      ) : (
                        r.date
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full border ${c.ring} ${c.text}`}>
                        {r.type}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-200">{r.description}</td>
                    <td className="px-4 py-2 text-right text-white">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={editQty}
                          onChange={(e) => setEditQty(e.target.value)}
                          className="bg-[#0e1117] border border-[#232733] rounded px-1.5 py-1 text-xs w-20 text-right"
                        />
                      ) : (
                        `${fmt(r.quantity)} ${r.uom}`
                      )}
                    </td>
                    <td className="px-4 py-2 text-slate-500 text-xs">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          className="bg-[#0e1117] border border-[#232733] rounded px-1.5 py-1 text-xs w-full"
                        />
                      ) : (
                        r.note || "-"
                      )}
                    </td>
                    {canEdit && (
                    <td className="px-4 py-2 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => saveEdit(r)}
                            className="text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={cancelEdit}
                            className="text-slate-500 hover:text-slate-300"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => startEdit(r)}
                            className="text-slate-400 hover:text-teal-400 disabled:opacity-50"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => deleteEntry(r)}
                            className="text-slate-400 hover:text-rose-400 disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {recent.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">No entries logged yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
