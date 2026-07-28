"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ collapsed }) {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    setTheme(current);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("thf-theme", next);
    } catch (e) {
      // ignore storage errors (private browsing, etc.)
    }
    setTheme(next);
  }

  return (
    <button
      onClick={toggle}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={`flex items-center gap-2.5 text-sm px-3 py-2 rounded-lg transition text-[var(--text-secondary)] hover:bg-[var(--hover-overlay)] hover:text-[var(--text-primary)] w-full ${
        collapsed ? "justify-center px-0" : ""
      }`}
    >
      {theme === "dark" ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
      {!collapsed && (theme === "dark" ? "Light mode" : "Dark mode")}
    </button>
  );
}
