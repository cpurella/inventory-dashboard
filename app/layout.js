import "./globals.css";
import Sidebar from "../components/Sidebar";

export const metadata = {
  title: "Inventory Ops Dashboard - THF 2026",
  description: "Trading Inventory Movement Dashboard 2026",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex bg-[#0b0e14]">
          <Sidebar />
          <div className="flex-1 min-w-0">
            <header className="px-4 md:px-6 py-3 border-b border-[#1c2029] flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-500">
                  Control / Dashboard
                </div>
                <h1 className="text-lg font-semibold text-white">Operations Dashboard</h1>
              </div>
            </header>
            <main className="p-4 md:p-6 max-w-7xl mx-auto">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
