import Link from "next/link";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Users, UploadCloud, History, RotateCcw, ChevronRight } from "lucide-react";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import AvatarUpload from "@/components/AvatarUpload";

const ROLE_LABEL = {
  ADMIN: "Admin — full access",
  EDITOR: "Editor — can log GRN/Usage/Damage",
  VIEWER: "Viewer — read only",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="max-w-2xl space-y-6 text-[var(--text-primary)]">
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
        <div className="flex items-center gap-3">
          <AvatarUpload initialAvatarUrl={user.avatarDataUrl} name={user.name} />
          <div>
            <div className="text-sm font-medium text-[var(--text-primary)]">{user.name}</div>
            <div className="text-xs text-[var(--text-muted)]">{user.email}</div>
          </div>
        </div>
        <div className="mt-3 text-xs text-[var(--text-secondary)]">
          Role: <span className="text-teal-400">{ROLE_LABEL[user.role] || user.role}</span>
        </div>
      </div>

      <ChangePasswordForm />

      {isAdmin(user) && (
        <div>
          <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] mb-2">Admin Tools</div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl divide-y divide-[var(--border-subtle)] overflow-hidden">
            <SettingsLink href="/settings/users" icon={Users} label="Manage Users" desc="Add teammates, set roles, remove access" />
            <SettingsLink href="/admin/upload" icon={UploadCloud} label="Upload Inventory File" desc="Merge an updated Excel report" />
            <SettingsLink href="/admin/upload-history" icon={History} label="Upload History" desc="See every file uploaded and by whom" />
            <SettingsLink href="/admin/import-history" icon={History} label="Import Bin Card History" desc="Load detailed day-by-day historical entries" />
          </div>
        </div>
      )}

      {isAdmin(user) && (
        <div>
          <div className="text-[11px] uppercase tracking-wider text-rose-400 mb-2">Danger Zone</div>
          <div className="border border-rose-500/30 bg-rose-500/5 rounded-xl overflow-hidden">
            <SettingsLink href="/admin/seed" icon={RotateCcw} label="Reset to Original Data" desc="Wipes every live GRN/Usage/Damage entry — cannot be undone" danger />
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsLink({ href, icon: Icon, label, desc, danger }) {
  return (
    <Link href={href} className="flex items-center justify-between px-4 py-3 hover:bg-[var(--hover-overlay)] transition">
      <div className="flex items-center gap-3">
        <Icon className={`w-4 h-4 ${danger ? "text-rose-400" : "text-[var(--text-secondary)]"}`} />
        <div>
          <div className={`text-sm ${danger ? "text-rose-400" : "text-[var(--text-primary)]"}`}>{label}</div>
          <div className="text-[11px] text-[var(--text-muted)]">{desc}</div>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-[var(--text-faint)]" />
    </Link>
  );
}
