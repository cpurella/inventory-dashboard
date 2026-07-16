import "./globals.css";

export const metadata = {
  title: "Inventory Dashboard - THF",
  description: "Trading Inventory Movement Dashboard 2026",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <header className="bg-slate-900 text-white px-6 py-4 shadow">
            <h1 className="text-xl font-semibold">
              📦 Thilafushi Trading Inventory Dashboard - 2026
            </h1>
          </header>
          <main className="p-4 md:p-8 max-w-7xl mx-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
