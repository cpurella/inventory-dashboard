"use client";

import { useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet } from "lucide-react";

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
      const formData = new FormData();
      formData.append("file", file);
      formData.append("confirm", "YES");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
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
    <div className="max-w-2xl space-y-4 text-slate-200">
      <div>
        <h2 className="text-lg font-semibold text-white">Upload Inventory File</h2>
        <p className="text-sm text-slate-500 mt-1">
          Drop in an updated inventory report (same format as the original — a "PHY-Inventory-List" sheet and
          an "Annual-Inv-MVMNT-..." sheet). The app merges it in automatically.
        </p>
      </div>

      <div className="bg-[#12151c] border border-emerald-500/30 rounded-xl p-4 flex gap-3">
        <FileSpreadsheet className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-sm text-slate-300">
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
          dragOver ? "border-teal-500/50 bg-teal-500/5" : "border-[#232733] hover:border-[#333]"
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
            <div className="text-sm text-white">{file.name}</div>
            <div className="text-xs text-slate-500">{(file.size / 1024).toFixed(0)} KB — click to choose a different file</div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <UploadCloud className="w-8 h-8" />
            <div className="text-sm">Drag & drop the .xlsx file here, or click to browse</div>
          </div>
        )}
      </div>

      {file && (
        <label className="flex items-start gap-2 text-sm text-slate-300">
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
        {busy ? "Uploading & merging..." : "Upload & Merge Data"}
      </button>

      {status && (
        <div className={`text-sm rounded-md p-3 ${status.ok ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
          {status.message}
        </div>
      )}
    </div>
  );
}
