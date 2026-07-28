import "./globals.css";

export const metadata = {
  title: "Inventory Ops Dashboard - THF 2026",
  description: "Trading Inventory Movement Dashboard 2026",
};

// Runs before paint so the correct theme applies immediately -- no flash of
// the wrong colors while React hydrates.
const themeInitScript = `
(function () {
  try {
    var saved = localStorage.getItem("thf-theme");
    var theme = saved === "light" || saved === "dark" ? saved : "dark";
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-[var(--bg-app)]">{children}</body>
    </html>
  );
}
