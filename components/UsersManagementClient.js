"use client";

import { useEffect, useState } from "react";
import { UserPlus, Trash2 } from "lucide-react";

const ROLES = ["ADMIN", "EDITOR", "VIEWER"];
const ROLE_DESC = {
  ADMIN: "Full access — users, uploads, reset",
  EDITOR: "Can log GRN / Usage / Damage entries",
  VIEWER: "Read-only — view dashboard & reports",
};

export default function UsersManagementClient({ currentUserId }) {
  const [users, setUsers] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("VIEWER");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [rowBusy, setRowBusy] = useState(null);

  async function load() {
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data.users || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not add user.");
      setName("");
      setEmail("");
      setPassword("");
      setRole("VIEWER");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRoleChange(id, newRole) {
    setRowBusy(id);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update role.");
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: newRole } : u)));
    } catch (err) {
      alert(err.message);
    } finally {
      setRowBusy(null);
    }
  }

  async function handleRemove(u) {
    if (!window.confirm(`Remove ${u.name} (${u.email})? They'll lose access immediately.`)) return;
    setRowBusy(u.id);
    try {
      const res = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not remove user.");
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } catch (err) {
      alert(err.message);
    } finally {
      setRowBusy(null);
    }
  }

  return (
    <div className="max-w-2xl space-y-4 text-[var(--text-primary)]">
      <div>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Only admins can add accounts. Choose a role based on what someone needs to do.
        </p>
      </div>

      <form onSubmit={handleAdd} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text" required placeholder="Full name" value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-[var(--bg-nested)] border border-[var(--border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal-500/50"
          />
          <input
            type="email" required placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-[var(--bg-nested)] border border-[var(--border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal-500/50"
          />
          <input
            type="password" required minLength={6} placeholder="Temporary password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-[var(--bg-nested)] border border-[var(--border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal-500/50"
          />
          <select
            value={role} onChange={(e) => setRole(e.target.value)}
            className="bg-[var(--bg-nested)] border border-[var(--border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal-500/50"
          >
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="text-[11px] text-[var(--text-muted)]">{ROLE_DESC[role]}</div>
        {error && <div className="text-sm rounded-md p-3 bg-rose-500/10 text-rose-400">{error}</div>}
        <button
          type="submit" disabled={busy}
          className="flex items-center gap-2 bg-teal-500 text-black text-sm font-medium px-4 py-2 rounded-md hover:bg-teal-400 disabled:opacity-50"
        >
          <UserPlus className="w-4 h-4" /> {busy ? "Adding..." : "Add User"}
        </button>
      </form>

      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--text-primary)]">All Users</h3>
        </div>
        <div className="divide-y divide-[var(--border-subtle)]">
          {users === null && <div className="p-6 text-center text-[var(--text-muted)] text-sm">Loading...</div>}
          {users && users.map((u) => (
            <div key={u.id} className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="min-w-0">
                <div className="text-sm text-[var(--text-primary)] truncate">
                  {u.name} {u.id === currentUserId && <span className="text-[10px] text-[var(--text-muted)]">(you)</span>}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] truncate">{u.email}</div>
                <div className="text-[10px] text-[var(--text-faint)] truncate">
                  {u.lastLoginAt
                    ? `Last login: ${new Date(u.lastLoginAt).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
                    : "Never logged in"}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={u.role}
                  disabled={rowBusy === u.id}
                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  className="bg-[var(--bg-nested)] border border-[var(--border)] rounded-md px-2 py-1 text-xs disabled:opacity-50"
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                {u.id !== currentUserId && (
                  <button
                    onClick={() => handleRemove(u)}
                    disabled={rowBusy === u.id}
                    className="text-[var(--text-secondary)] hover:text-rose-400 disabled:opacity-50"
                    title="Remove user"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
