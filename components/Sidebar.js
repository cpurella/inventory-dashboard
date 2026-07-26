"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ListTree, TrendingUp, FileText, BookOpen, ClipboardList, Boxes,
  Settings, ChevronsLeft, ChevronsRight,
} from "lucide-react";

const NAV = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Master Catalogue", href: "/catalogue", icon: ListTree },
  { label: "Movement Reports", href: "/movement", icon: TrendingUp },
  { label: "Item Reports", href: "/reports", icon: FileText },
  { label: "Bin Cards", href: "/bincards", icon: BookOpen },
  { label: "Inventory Thilafushi", href: "/inventory", icon: ClipboardList },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`hidden md:flex sticky top-0 h-screen shrink-0 flex-col border-r border-[#1c2029] bg-gradient-to-b from-[#0e1117] to-[#0b0e14] py-4 transition-all ${
        collapsed ? "w-16 px-2" : "w-56 px-4"
      }`}
    >
      <div className={`flex items-center gap-2 mb-6 ${collapsed ? "px-0 justify-center" : "px-1"}`}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20 shrink-0">
          <Boxes className="w-4.5 h-4.5 text-black" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-wide text-white truncate">THF STOCK</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider truncate">
              Operations Control
            </div>
          </div>
        )}
      </div>

      <nav className="space-y-0.5 mb-6 flex-1 overflow-y-auto">
        {NAV.map((n) => {
          const active = pathname === n.href || pathname.startsWith(n.href + "/");
          const Icon = n.icon;
          return (
            <Link
              key={n.label}
              href={n.href}
              title={collapsed ? n.label : undefined}
              className={`flex items-center gap-2.5 text-sm px-3 py-2 rounded-lg transition relative ${
                collapsed ? "justify-center px-0" : ""
              } ${
                active
                  ? "bg-teal-500/10 text-teal-300"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              {active && !collapsed && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-teal-400" />
              )}
              <Icon className="w-4 h-4 shrink-0" strokeWidth={2} />
              {!collapsed && n.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#1c2029] pt-3 space-y-2">
        <Link
          href="/settings"
          title={collapsed ? "Settings" : undefined}
          className={`flex items-center gap-2.5 text-sm px-3 py-2 rounded-lg transition ${
            collapsed ? "justify-center px-0" : ""
          } ${
            pathname.startsWith("/settings")
              ? "bg-teal-500/10 text-teal-300"
              : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" strokeWidth={2} />
          {!collapsed && "Settings"}
        </Link>

        {!collapsed && (
          <div className="text-[11px] text-slate-500 flex items-center gap-2 px-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            Live database connected
          </div>
        )}

        <button
          onClick={() => setCollapsed((c) => !c)}
          className="w-full flex items-center justify-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-300 px-2 py-1.5 rounded-md hover:bg-white/5"
        >
          {collapsed ? <ChevronsRight className="w-4 h-4" /> : (
            <>
              <ChevronsLeft className="w-4 h-4" /> Collapse
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
