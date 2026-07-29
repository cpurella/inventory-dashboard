"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { UploadCloud, FileSpreadsheet } from "lucide-react";
import { MONTH_KEYS } from "@/lib/constants";

function round2(n) {
  return typeof n === "number" && !Number.isNaN(n) ? Math.round(n * 100) / 100 : 0;
}

// Runs entirely in the browser -- reads the .xlsx and extracts just the item
// rows as compact JSON, so only a small payload (not the whole file) ever
// has to travel to the server. This is what avoids Vercel's request body
// size limit on larger workbooks.
function parseWorkbook(arrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true });

  const phySheetName = workbook.SheetNames.find((n) =>
    n.toLowerCase().replace(/\s/g, "").includes("phy-inventory") ||
    n.toLowerCase().replace(/\s/g, "").includes("phyinventory")
  );
  const mvmtSheetName = workbook.SheetNames.find((n) =>
    n.toLowerCase().includes("mvmnt") || n.toLowerCase().includes("movement")
  );

  if (!phySheetName || !mvmtSheetName) {
    throw new Error(
      `Could not find the expected sheets in this file. Sheets found: ${workbook.SheetNames.join(", ")}. Expected one sheet with "PHY-Inventory-List" and one with "MVMNT" in the name.`
    );
  }

  const phy = XLSX.utils.sheet_to_json(workbook.Sheets[phySheetName], { header: 1, raw: true, defval: null });
  const mvmt = XLSX.utils.sheet_to_json(workbook.Sheets[mvmtSheetName], { header: 1, raw: true, defval: null });

  const mvmtHeaderCell = String(mvmt[2]?.[1] || "").toLowerCase();
  const phyHeaderCell = String(phy[5]?.[5] || "").toLowerCase();
  if (!mvmtHeaderCell.includes("code")) {
    throw new Error(
      `The movement sheet's layout looks different than expected (header row 3, column B should say "Code"). Found: "${mvmt[2]?.[1] ?? ""}".`
    );
  }
  if (!phyHeaderCell.includes("description")) {
    throw new Error(
      `The PHY inventory sheet's layout looks different than expected (header row 6, column F should say "Item Description"). Found: "${phy[5]?.[5] ?? ""}".`
    );
  }

  const parsedItems = [];
  for (let i = 0; i < 5000; i++) {
    const phyRow = phy[6 + i];
    const mvmtRow = mvmt[3 + i];
    if (!mvmtRow || mvmtRow[1] == null || mvmtRow[1] === "") break;

    const code = mvmtRow[1];
    const description = mvmtRow[2];
    const uom = mvmtRow[4];

    const category = (phyRow && phyRow[4]) || "Uncategorized";
    const packingSize = phyRow ? phyRow[6] : null;
    const discontinued = phyRow ? !!phyRow[14] : false;

    const months = [];
    for (let m = 0; m < 12; m++) {
      const col = 5 + 4 * m;
      months.push({
        month: MONTH_KEYS[m],
        opening: round2(mvmtRow[col]),
        added: round2(mvmtRow[col + 1]),
        usage: round2(mvmtRow[col + 2]),
        closing: round2(mvmtRow[col + 3]),
      });
    }

    const avgPerDay = round2(mvmtRow[59]);

    parsedItems.push({
      code: String(code),
      description: description || "Unnamed item",
      category: String(category),
      uom: uom || "NOS",
      packingSize: packingSize != null ? String(packingSize) : null,
      avgPerDay,
      discontinued,
      months,
    });
  }

  if (parsedItems.length === 0) {
    throw new Error("No item rows were found in this file.");
  }

  // The PHY-Inventory-List sheet has an "AS AT" label + date near the top
  // (row 3, roughly column N/O) showing what date the physical count reflects.
  let asOfDate = null;
  for (let r = 0; r < 6; r++) {
    const row = phy[r];
    if (!row) continue;
    for (let c = 0; c < row.length; c++) {
      if (String(row[c] || "").trim().toLowerCase() === "as at") {
        const candidate = row[c + 1];
        if (candidate instanceof Date) asOfDate = candidate.toISOString().slice(0, 10);
        break;
      }
    }
    if (asOfDate) break;
  }

  return { parsedItems, asOfDate };
}

export default function UploadClient() {
  const [file, setFile] = useState(null);
  const [understood, setUnderstood] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  function pickFile(f) {
    if (!f) return;
    setFile(f);
    setStatus(null);
  }

  async function handleUpload() {
    if (!file || !understood) return;
    setBusy(true);
    setStatus(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const { parsedItems, asOfDate } = parseWorkbook(arrayBuffer);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, parsedItems, asOfDate }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload failed.");

      setStatus({
        ok: true,
        message: `Merged "${file.name}": ${data.itemsUpdated} existing items updated, ${data.itemsAdded} new items added${data.itemsUntouched ? `, ${data.itemsUntouched} older items left untouched` : ""}. Your logged entries are untouched.`,
      });
      setFile(null);
      setUnderstood(false);
    } catch (err) {
      setStatus({ ok: false, message: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-4 text-[var(--text-primary)]">
      <div>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Drop in an updated inventory report (same format as the original — a "PHY-Inventory-List" sheet and
          an "Annual-Inv-MVMNT-..." sheet). The file is read right here in your browser, then only the
          extracted item data is sent to merge in — so even large files upload fine.
        </p>
      </div>

      <div className="bg-[var(--bg-card)] border border-emerald-500/30 rounded-xl p-4 flex gap-3">
        <FileSpreadsheet className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-sm text-[var(--text-primary)]">
          <strong className="text-emerald-400">Your logged entries are safe.</strong> Uploading a new file
          updates item details (description, category, UOM) and merges in the new quantities as a top-up —
          it does <strong>not</strong> erase any GRN, Usage, or Damage entries you've logged in the app. Any new
          items in the file get added; items already tracked get reconciled, not replaced.
        </div>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) pickFile(f);
        }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition ${
          dragOver ? "border-teal-500/50 bg-teal-500/5" : "border-[var(--border)] hover:border-[#333]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
        {file ? (
          <div className="flex flex-col items-center gap-2">
            <FileSpreadsheet className="w-8 h-8 text-emerald-400" />
            <div className="text-sm text-[var(--text-primary)]">{file.name}</div>
            <div className="text-xs text-[var(--text-muted)]">{(file.size / 1024).toFixed(0)} KB — click to choose a different file</div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-[var(--text-muted)]">
            <UploadCloud className="w-8 h-8" />
            <div className="text-sm">Drag & drop the .xlsx file here, or click to browse</div>
          </div>
        )}
      </div>

      {file && (
        <label className="flex items-start gap-2 text-sm text-[var(--text-primary)]">
          <input
            type="checkbox"
            checked={understood}
            onChange={(e) => setUnderstood(e.target.checked)}
            className="mt-1"
          />
          Go ahead and merge this file's item details and quantities into the live data.
        </label>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || !understood || busy}
        className="bg-teal-500 text-black text-sm font-medium px-4 py-2 rounded-md hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {busy ? "Reading file & merging..." : "Upload & Merge Data"}
      </button>

      {status && (
        <div className={`text-sm rounded-md p-3 ${status.ok ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
          {status.message}
        </div>
      )}
    </div>
  );
}
