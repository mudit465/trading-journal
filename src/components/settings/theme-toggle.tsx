"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(true);

  // Load saved theme
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light") {
      setDark(false);
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);

    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-zinc-300 dark:text-zinc-300 text-zinc-700">
          Theme
        </p>
        <p className="text-xs text-zinc-500 mt-0.5">
          {dark ? "Dark mode active" : "Light mode active"}
        </p>
      </div>

      <button
        onClick={toggleTheme}
        className="flex items-center gap-2 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm"
      >
        {dark ? (
          <>
            <Sun className="h-4 w-4" />
            Light
          </>
        ) : (
          <>
            <Moon className="h-4 w-4" />
            Dark
          </>
        )}
      </button>
    </div>
  );
}