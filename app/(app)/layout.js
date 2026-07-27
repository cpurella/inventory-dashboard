import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import LogoutButton from "@/components/LogoutButton";

export default async function AppLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex bg-[#0b0e14]">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <header className="px-4 md:px-6 py-3 border-b border-[#1c2029] bg-gradient-to-r from-[#0e1117] to-[#0b0e14] flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500">
              Control / Dashboard
            </div>
            <h1 className="text-lg font-semibold text-white">Operations Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm text-white">Welcome, {user.name}</div>
              <div className="text-[11px] text-slate-500">{user.email}</div>
            </div>
            <div className="w-9 h-9 rounded-full overflow-hidden bg-teal-500/15 border border-[#232733] flex items-center justify-center shrink-0">
              {user.avatarDataUrl ? (
                <img src={user.avatarDataUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-teal-400 text-xs font-semibold">
                  {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                </span>
              )}
            </div>
            <LogoutButton />
          </div>
        </header>
        <main className="p-4 md:p-6 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
