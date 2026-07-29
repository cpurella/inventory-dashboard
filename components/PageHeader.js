"use client";

import { usePathname } from "next/navigation";

const PAGES = [
  { match: (p) => p === "/", title: "Dashboard", desc: "Live stock levels, reorder alerts, and category breakdowns" },
  { match: (p) => p.startsWith("/catalogue"), title: "Master Catalogue", desc: "Browse, search, and manage every tracked item" },
  { match: (p) => p.startsWith("/movement"), title: "Movement Reports", desc: "Monthly Added/Usage trends by item" },
  { match: (p) => p.startsWith("/reports"), title: "Item Reports", desc: "Printable per-item stock reports and CSV export" },
  { match: (p) => p.startsWith("/bincards"), title: "Bin Cards", desc: "Detailed receipt and issue history by category" },
  { match: (p) => p.startsWith("/inventory"), title: "Inventory Thilafushi", desc: "Log GRN, usage, and damage entries" },
  { match: (p) => p.startsWith("/item/"), title: "Item Detail", desc: "Full movement history and Bin Card ledger" },
  { match: (p) => p.startsWith("/settings/users"), title: "Manage Users", desc: "Add teammates and set access roles" },
  { match: (p) => p.startsWith("/settings"), title: "Settings", desc: "Your account, profile, and admin tools" },
  { match: (p) => p.startsWith("/admin/upload-history"), title: "Upload History", desc: "Every file uploaded and by whom" },
  { match: (p) => p.startsWith("/admin/import-history"), title: "Import Bin Card History", desc: "Load detailed day-by-day historical entries" },
  { match: (p) => p.startsWith("/admin/upload"), title: "Upload Inventory File", desc: "Merge an updated Excel report" },
  { match: (p) => p.startsWith("/admin/seed"), title: "Reset to Original Data", desc: "Danger zone — wipes all live entries" },
];

export default function PageHeader({ children }) {
  const pathname = usePathname();
  const page = PAGES.find((p) => p.match(pathname)) || { title: "THF Stock", desc: "" };

  return (
    <header className="px-4 md:px-6 py-2.5 border-b border-[var(--border-subtle)] bg-gradient-to-r from-[var(--bg-nested)] to-[var(--bg-app)] flex items-center justify-between gap-3">
      <div>
        <h1 className="text-base font-semibold text-[var(--text-primary)] leading-tight">{page.title}</h1>
        {page.desc && <p className="text-[11px] text-[var(--text-muted)] leading-tight">{page.desc}</p>}
      </div>
      {children}
    </header>
  );
}
