import Link from "next/link";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { User, Users, UploadCloud, History, RotateCcw, ChevronRight } from "lucide-react";
import ChangePasswordForm from "@/components/ChangePasswordForm";

const ROLE_LABEL = {
  ADMIN: "Admin — full access",
  EDITOR: "Editor — can log GRN/Usage/Damage",
  VIEWER: "Viewer — read only",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="max-w-2xl space-y-6 text-slate-200">
      <div>
        <h2 className="text-lg font-semibold text-white">Settings</h2>
        <p className="text-sm text-slate-500 mt-1">Your account and admin tools.</p>
      </div>

      <div className="bg-[#12151c] border border-[#232733] rounded-xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-500/15 text-teal-400 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-medium text-white">{user.name}</div>
            <div className="text-xs text-slate-500">{user.email}</div>
          </div>
        </div>
        <div className="mt-3 text-xs text-slate-400">
          Role: <span className="text-teal-400">{ROLE_LABEL[user.role] || user.role}</span>
        </div>
      </div>

      <ChangePasswordForm />

      {isAdmin(user) && (
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">Admin Tools</div>
          <div className="bg-[#12151c] border border-[#232733] rounded-xl divide-y divide-[#1c2029] overflow-hidden">
            <SettingsLink href="/settings/users" icon={Users} label="Manage Users" desc="Add teammates, set roles, remove access" />
            <SettingsLink href="/admin/upload" icon={UploadCloud} label="Upload Inventory File" desc="Merge an updated Excel report" />
            <SettingsLink href="/admin/upload-history" icon={History} label="Upload History" desc="See every file uploaded and by whom" />
            <SettingsLink href="/admin/import-history" icon={History} label="Import Bin Card History" desc="Load detailed day-by-day historical entries" />
            <SettingsLink href="/admin/seed" icon={RotateCcw} label="Reset to Original Data" desc="Danger zone — wipes all live entries" danger />
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsLink({ href, icon: Icon, label, desc, danger }) {
  return (
    <Link href={href} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition">
      <div className="flex items-center gap-3">
        <Icon className={`w-4 h-4 ${danger ? "text-rose-400" : "text-slate-400"}`} />
        <div>
          <div className={`text-sm ${danger ? "text-rose-400" : "text-slate-200"}`}>{label}</div>
          <div className="text-[11px] text-slate-500">{desc}</div>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-600" />
    </Link>
  );
}
