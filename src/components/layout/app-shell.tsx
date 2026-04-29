// src/components/layout/app-shell.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Menu, X, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";
import type { Session } from "next-auth";

interface AppShellProps {
  children: React.ReactNode;
  session: Session;
}

export function AppShell({ children, session }: AppShellProps) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [close]);

  // Lock body scroll when drawer is open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="flex h-screen w-full overflow-hidden">

      {/* ── Desktop sidebar: visible md and up ──────────────────────── */}
      <aside className="hidden md:flex md:w-56 lg:w-60 flex-shrink-0">
        <Sidebar session={session} onNavigate={close} />
      </aside>

      {/* ── Mobile: backdrop ─────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        onClick={close}
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm",
          "transition-opacity duration-300 md:hidden",
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
      />

      {/* ── Mobile: slide-in drawer panel ───────────────────────────── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-56 flex flex-col",
          "transition-transform duration-300 ease-in-out md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Close button inside drawer */}
        <button
          onClick={close}
          aria-label="Close menu"
          className="absolute top-4 right-3 z-10 rounded-md p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Reuse same Sidebar — passes onNavigate so links close drawer */}
        <Sidebar session={session} onNavigate={close} />
      </div>

      {/* ── Right column: topbar + scrollable content ───────────────── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">

        {/* Mobile topbar — hidden on md+ */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-zinc-900 bg-zinc-950 flex-shrink-0 md:hidden">
          <button
            onClick={toggle}
            aria-label="Open navigation menu"
            aria-expanded={open}
            className="rounded-md p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-400" strokeWidth={2.5} />
            <span className="text-sm font-semibold text-zinc-100 tracking-tight">
              TradeLog
            </span>
          </div>
        </header>

        {/* Page content — scrolls independently */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>

      </div>
    </div>
  );
}