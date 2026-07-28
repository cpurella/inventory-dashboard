"use client";

import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";

const TARGET_SIZE = 160;

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = TARGET_SIZE;
        canvas.height = TARGET_SIZE;
        const ctx = canvas.getContext("2d");

        // Center-crop to a square before scaling down.
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, TARGET_SIZE, TARGET_SIZE);

        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AvatarUpload({ initialAvatarUrl, name }) {
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl || null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const inputRef = useRef(null);

  const initials = (name || "")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleFile(file) {
    if (!file) return;
    setBusy(true);
    setStatus(null);
    try {
      const dataUrl = await resizeImage(file);
      const res = await fetch("/api/auth/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarDataUrl: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save profile picture.");
      setAvatarUrl(dataUrl);
      setStatus({ ok: true, message: "Profile picture updated." });
    } catch (err) {
      setStatus({ ok: false, message: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/auth/avatar", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not remove profile picture.");
      setAvatarUrl(null);
      setStatus({ ok: true, message: "Profile picture removed." });
    } catch (err) {
      setStatus({ ok: false, message: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div
        onClick={() => inputRef.current?.click()}
        className="relative w-16 h-16 rounded-full overflow-hidden cursor-pointer group shrink-0 bg-teal-500/15 border border-[var(--border)] flex items-center justify-center"
        title="Change profile picture"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <span className="text-teal-400 text-lg font-semibold">{initials || "?"}</span>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
          <Camera className="w-5 h-5 text-white" />
        </div>
      </div>

      <div className="space-y-1.5">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="text-xs bg-teal-500 text-black font-medium px-3 py-1.5 rounded-md hover:bg-teal-400 disabled:opacity-50"
          >
            {busy ? "Saving..." : "Change Photo"}
          </button>
          {avatarUrl && (
            <button
              onClick={handleRemove}
              disabled={busy}
              className="text-xs flex items-center gap-1 text-[var(--text-secondary)] hover:text-rose-400 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove
            </button>
          )}
        </div>
        {status && (
          <div className={`text-[11px] ${status.ok ? "text-emerald-400" : "text-rose-400"}`}>{status.message}</div>
        )}
      </div>
    </div>
  );
}
