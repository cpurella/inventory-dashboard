import "./globals.css";

export const metadata = {
  title: "Inventory Ops Dashboard - THF 2026",
  description: "Trading Inventory Movement Dashboard 2026",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#0b0e14]">{children}</body>
    </html>
  );
}
