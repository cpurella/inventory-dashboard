"use client";

import { X } from "lucide-react";

export default function Modal({ open, onClose, children, maxWidth = "max-w-xl" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-10 px-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} bg-[#0e1117] border border-[#232733] rounded-xl shadow-2xl`}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-500 hover:text-slate-200 z-10"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
