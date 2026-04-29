// src/components/layout/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  TrendingUp,
  LayoutDashboard,
  Calendar,
  StickyNote,
  Plus,
  LogOut,
  Settings,
  Tag,
  TableProperties,
} from "lucide-react";

import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Session } from "@/types";

const navItems = [
  { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { href: "/journal",    label: "Journal",    icon: Calendar },
  { href: "/notes",      label: "Notes",      icon: StickyNote },
  { href: "/concepts",   label: "Concepts",   icon: Tag },
  { href: "/all-trades", label: "All Trades", icon: TableProperties },
];

type SidebarProps = {
  session: Session;
  onNavigate?: () => void;
};

export function Sidebar({ session, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  /*
   * ⚠️  KEY FIX: The original component wrapped everything in its own
   *    <aside className="flex flex-col w-56 ... min-h-screen">
   *
   * That inner <aside> was ALWAYS "flex" — it ignored the parent's
   * "hidden md:flex" completely, so the sidebar was always visible on mobile.
   *
   * Fix: The sidebar component now renders a plain <div> that fills
   * whatever container the parent gives it. The parent (AppShell) is
   * solely responsible for showing/hiding and setting the width.
   */
  return (
    <div className="flex flex-col w-full h-full border-r border-zinc-900 bg-zinc-950">

      {/* Logo */}
      <div className="px-4 py-5 border-b border-zinc-900 flex-shrink-0">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-indigo-400" />
          <span className="font-semibold text-zinc-100 text-sm tracking-tight">
            TradeLog
          </span>
        </div>
      </div>

      {/* New Trade */}
      <div className="px-3 pt-4 pb-2 flex-shrink-0">
        <Link
          href="/trades/new"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20"
          )}
        >
          <Plus className="h-4 w-4 shrink-0" />
          New Trade
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-zinc-800 text-zinc-100 font-medium"
                  : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: settings, sign out, user */}
      <div className="px-3 pb-4 space-y-0.5 border-t border-zinc-900 pt-3 flex-shrink-0">
        <Link
          href="/settings"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
            pathname === "/settings"
              ? "bg-zinc-800 text-zinc-100 font-medium"
              : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          Profile
        </Link>

        <button
          onClick={() => { onNavigate?.(); signOut({ callbackUrl: "/" }); }}
          className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-sm transition-colors text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>

        <div className="flex items-center gap-2.5 px-3 py-2 mt-1">
          <Avatar className="h-6 w-6 flex-shrink-0">
            <AvatarImage src={session.user.image ?? undefined} />
            <AvatarFallback className="text-[10px]">
              {getInitials(session.user.name || "User")}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs font-medium text-zinc-300 truncate">
              {session.user.name}
            </p>
            <p className="text-[10px] text-zinc-600 truncate">
              {session.user.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}