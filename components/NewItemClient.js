"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";

export default function NewItemClient({ categories }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0] || "");
  const [customCategory, setCustomCategory] = useState("");
  const [uom, setUom] = useState("NOS");
  const [packingSize, setPackingSize] = useState("");
  const [openingStock, setOpeningStock] = useState("0");
  const [avgPerDay, setAvgPerDay] = useState("0");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const finalCategory = category === "__new__" ? customCategory : category;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!code || !description || !finalCategory || !uom) {
      setMessage({ ok: false, text: "Please fill in code, description, category, and unit." });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          description,
          category: finalCategory,
          uom,
          packingSize: packingSize || null,
          openingStock: Number(openingStock) || 0,
          avgPerDay: Number(avgPerDay) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create item.");
      setMessage({ ok: true, text: `"${description}" added successfully.` });
      setTimeout(() => router.push(`/item/${data.itemId}`), 900);
    } catch (err) {
      setMessage({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl space-y-4 text-slate-200">
      <div>
        <h2 className="text-lg font-semibold text-white">Add New Item</h2>
        <p className="text-sm text-slate-500 mt-1">
          For a brand-new item that isn't in the current catalogue yet. It will immediately show up
          everywhere — Dashboard, Master Catalogue, Bin Cards, and Inventory Thilafushi.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#12151c] border border-[#232733] rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-500 block mb-1">Item Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full bg-[#0e1117] border border-[#232733] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal-500/50"
              placeholder="e.g. 1099999"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-500 block mb-1">Unit (UOM)</label>
            <input
              type="text"
              value={uom}
              onChange={(e) => setUom(e.target.value)}
              className="w-full bg-[#0e1117] border border-[#232733] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal-500/50"
              placeholder="NOS, TON, KG, BAG..."
            />
          </div>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wide text-slate-500 block mb-1">Item Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-[#0e1117] border border-[#232733] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal-500/50"
            placeholder="Full item name"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-500 block mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#0e1117] border border-[#232733] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal-500/50"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="__new__">+ New category...</option>
            </select>
            {category === "__new__" && (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full mt-2 bg-[#0e1117] border border-[#232733] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal-500/50"
                placeholder="New category name"
              />
            )}
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-500 block mb-1">Packing Size (optional)</label>
            <input
              type="text"
              value={packingSize}
              onChange={(e) => setPackingSize(e.target.value)}
              className="w-full bg-[#0e1117] border border-[#232733] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal-500/50"
              placeholder="e.g. 1 x 50kg"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-500 block mb-1">Opening Stock</label>
            <input
              type="number"
              min="0"
              step="any"
              value={openingStock}
              onChange={(e) => setOpeningStock(e.target.value)}
              className="w-full bg-[#0e1117] border border-[#232733] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal-500/50"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-500 block mb-1">Avg Usage / Day (optional)</label>
            <input
              type="number"
              min="0"
              step="any"
              value={avgPerDay}
              onChange={(e) => setAvgPerDay(e.target.value)}
              className="w-full bg-[#0e1117] border border-[#232733] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal-500/50"
            />
            <div className="text-[11px] text-slate-500 mt-1">Used to estimate run-out days. Leave 0 if unknown.</div>
          </div>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="flex items-center gap-2 bg-teal-500 text-black text-sm font-medium px-4 py-2 rounded-md hover:bg-teal-400 disabled:opacity-50"
        >
          <PlusCircle className="w-4 h-4" />
          {busy ? "Adding..." : "Add Item"}
        </button>

        {message && (
          <div className={`text-sm rounded-md p-3 ${message.ok ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
            {message.text}
          </div>
        )}
      </form>
    </div>
  );
}
