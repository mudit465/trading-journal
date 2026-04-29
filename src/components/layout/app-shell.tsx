// src/components/layout/app-shell.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Menu, X, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";
import type { Session } from "@/types";

interface AppShellProps {
  children: React.ReactNode;
  session: Session;
}

export function AppShell({ children, session }: AppShellProps) {
  const [open, setOpen] = useState(false);
  const close  = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  // Close drawer on Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [close]);

  // Lock body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    /*
     * Root shell:
     *  - h-screen + overflow-hidden → clamps the layout to the viewport,
     *    no page-level scroll; only <main> scrolls inside.
     *  - w-full → never wider than viewport.
     */
    <div className="flex h-screen w-full overflow-hidden">

      {/*
       * ── DESKTOP SIDEBAR ────────────────────────────────────────────
       * hidden  → display:none on mobile  (sidebar takes ZERO space)
       * md:flex → display:flex on ≥768px  (sidebar appears in flow)
       *
       * The <Sidebar> inside renders a plain <div> (not its own <aside>),
       * so this parent's hidden/flex is what actually controls visibility.
       */}
      <aside className="hidden md:flex md:w-56 lg:w-60 flex-shrink-0">
        <Sidebar session={session} />
      </aside>

      {/*
       * ── MOBILE DRAWER BACKDROP ─────────────────────────────────────
       * Fixed overlay behind the panel. Clicking it closes the drawer.
       * pointer-events-none when hidden so taps pass through to content.
       * md:hidden → backdrop never renders on desktop.
       */}
      <div
        aria-hidden="true"
        onClick={close}
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden",
          "transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />

      {/*
       * ── MOBILE DRAWER PANEL ────────────────────────────────────────
       * Slides in from the left via translate-x.
       * z-50 sits above the backdrop (z-40).
       * md:hidden → panel never renders on desktop.
       */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-56 flex flex-col md:hidden",
          "transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Close (×) button */}
        <button
          onClick={close}
          aria-label="Close menu"
          className="absolute top-4 right-3 z-10 rounded-md p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Sidebar content — same component, onNavigate closes the drawer */}
        <Sidebar session={session} onNavigate={close} />
      </div>

      {/*
       * ── RIGHT COLUMN ───────────────────────────────────────────────
       * flex-1   → takes all remaining horizontal space
       * min-w-0  → CRITICAL: without this, a flex child's min-width
       *            defaults to "auto" (its content size), which overrides
       *            flex-1 and lets content blow past the viewport.
       * overflow-hidden → clips children; only <main> scrolls.
       */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">

        {/*
         * ── MOBILE TOP BAR ─────────────────────────────────────────
         * flex    → shown on mobile
         * md:hidden → gone on desktop (sidebar is in flow instead)
         */}
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

        {/*
         * ── PAGE CONTENT ───────────────────────────────────────────
         * flex-1          → fills remaining vertical space
         * overflow-y-auto → this is the ONLY scroll container on mobile
         * overflow-x-hidden → prevents any child from widening the page
         */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>

      </div>
    </div>
  );
}