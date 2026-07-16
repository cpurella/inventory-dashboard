import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Inventory Ops Dashboard - THF 2026",
  description: "Trading Inventory Movement Dashboard 2026",
};

const NAV = [
  { label: "Dashboard", href: "/", active: true },
  { label: "Master Catalogue", href: "/#catalogue" },
  { label: "Stock Movement", href: "/#catalogue" },
];

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex bg-[#0b0e14]">
          {/* Sidebar */}
          <aside className="hidden md:flex w-60 flex-col border-r border-[#1c2029] bg-[#0e1117] px-4 py-5">
            <div className="flex items-center gap-2 px-1 mb-8">
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
              {NAV.map((n) => (
                <Link
                  key={n.label}
                  href={n.href}
                  className={`block text-sm px-3 py-2 rounded-md transition ${
                    n.active
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                      : "text-slate-400 hover:bg-white/5"
                  }`}
                >
                  {n.label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto text-[11px] text-slate-500 px-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Data loaded — 2026
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <header className="px-4 md:px-8 py-4 border-b border-[#1c2029] flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-500">
                  Control / Dashboard
                </div>
                <h1 className="text-lg font-semibold text-white">Operations Dashboard</h1>
              </div>
            </header>
            <main className="p-4 md:p-8 max-w-7xl mx-auto">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
