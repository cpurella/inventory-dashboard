"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ListTree, TrendingUp, FileText, BookOpen, ClipboardList, Boxes,
} from "lucide-react";

const NAV = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Master Catalogue", href: "/#catalogue", icon: ListTree },
  { label: "Movement Reports", href: "/movement", icon: TrendingUp },
  { label: "Item Reports", href: "/reports", icon: FileText },
  { label: "Bin Cards", href: "/bincards", icon: BookOpen },
  { label: "Inventory Thilafushi", href: "/inventory", icon: ClipboardList },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-56 flex-col border-r border-[#1c2029] bg-gradient-to-b from-[#0e1117] to-[#0b0e14] px-4 py-4">
      <div className="flex items-center gap-2 px-1 mb-6">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
          <Boxes className="w-4.5 h-4.5 text-black" strokeWidth={2.5} />
        </div>
        <div>
          <div className="text-sm font-semibold tracking-wide text-white">THF STOCK</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">
            Operations Control
          </div>
        </div>
      </div>

      <div className="text-[10px] uppercase tracking-wider text-slate-500 px-2 mb-2">
        Overview
      </div>
      <nav className="space-y-0.5 mb-6">
        {NAV.map((n) => {
          const hrefPath = n.href.split("#")[0] || "/";
          const active = hrefPath === "/" ? pathname === "/" : pathname === hrefPath || pathname.startsWith(hrefPath + "/");
          const Icon = n.icon;
          return (
            <Link
              key={n.label}
              href={n.href}
              className={`flex items-center gap-2.5 text-sm px-3 py-2 rounded-lg transition relative ${
                active
                  ? "bg-teal-500/10 text-teal-300"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-teal-400" />}
              <Icon className="w-4 h-4 shrink-0" strokeWidth={2} />
              {n.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto text-[11px] text-slate-500 px-2 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
        Live database connected
      </div>
      <div className="border-t border-[#1c2029] mt-3 pt-3 space-y-1.5">
        <Link href="/admin/upload" className="block text-[11px] text-slate-600 hover:text-slate-400 px-2">
          Upload inventory file
        </Link>
        <Link href="/admin/upload-history" className="block text-[11px] text-slate-600 hover:text-slate-400 px-2">
          Upload history
        </Link>
        <Link href="/admin/import-history" className="block text-[11px] text-slate-600 hover:text-slate-400 px-2">
          Import bin card history
        </Link>
        <Link href="/admin/seed" className="block text-[11px] text-slate-600 hover:text-slate-400 px-2">
          Data setup / reset
        </Link>
      </div>
    </aside>
  );
}
