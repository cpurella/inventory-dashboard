import Link from "next/link";

export default function UserBadge({ user }) {
  const initials = (user.name || "")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Link
      href="/settings"
      className="flex items-center gap-2 shrink-0 hover:opacity-80 transition"
      title="Go to Settings"
    >
      <span className="text-xs text-[var(--text-secondary)] hidden sm:inline">{user.name}</span>
      <div className="w-7 h-7 rounded-full overflow-hidden bg-teal-500/15 border border-[var(--border)] flex items-center justify-center shrink-0">
        {user.avatarDataUrl ? (
          <img src={user.avatarDataUrl} alt={user.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-teal-400 text-[10px] font-semibold">{initials || "?"}</span>
        )}
      </div>
    </Link>
  );
}
