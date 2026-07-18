"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { label: "Dashboard", href: "/" },
  { label: "Master Catalogue", href: "/#catalogue" },
  { label: "Movement Reports", href: "/movement" },
  { label: "Item Reports", href: "/reports" },
  { label: "Inventory Thilafushi", href: "/inventory" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-56 flex-col border-r border-[#1c2029] bg-[#0e1117] px-4 py-4">
      <div className="flex items-center gap-2 px-1 mb-6">
        <div className="w-8 h-8 rounded-md bg-amber-500 flex items-center justify-center font-bold text-black">
          T
        </div>
        <div>
          <div className="text-sm font-semibold tracking-wide">THF STOCK</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">
            Operations Control
          </div>
        </div>
      </div>

      <div className="text-[10px] uppercase tracking-wider text-slate-500 px-2 mb-2">
        Overview
      </div>
      <nav className="space-y-1 mb-6">
        {NAV.map((n) => {
          const hrefPath = n.href.split("#")[0] || "/";
          const active = hrefPath === "/" ? pathname === "/" : pathname === hrefPath || pathname.startsWith(hrefPath + "/");
          return (
            <Link
              key={n.label}
              href={n.href}
              className={`block text-sm px-3 py-2 rounded-md transition ${
                active
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                  : "text-slate-400 hover:bg-white/5"
              }`}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto text-[11px] text-slate-500 px-2 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
        Live database connected
      </div>
      <Link
        href="/admin/seed"
        className="text-[11px] text-slate-600 hover:text-slate-400 px-2 mt-2"
      >
        Data setup / reset
      </Link>
    </aside>
  );
}
