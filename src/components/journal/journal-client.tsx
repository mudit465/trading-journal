// src/components/journal/journal-client.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import {
  TrendingUp, TrendingDown, Minus,
  ChevronRight, Search, SlidersHorizontal,
} from "lucide-react";
import { Input }  from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Trade } from "@/types";
import { cn } from "@/lib/utils";

type Props = { trades: Trade[] };

function formatDayLabel(dateStr: string): string {
  const d = parseISO(dateStr);
  if (isToday(d))     return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEEE, MMMM d");
}

export function JournalClient({ trades }: Props) {
  const [search,        setSearch]        = useState("");
  const [filterStatus,  setFilterStatus]  = useState("ALL");
  const [filterSession, setFilterSession] = useState("ALL");

  // Group trades by date and apply filters
  const grouped = useMemo(() => {
    const filtered = trades.filter((t) => {
      const matchSearch =
        !search ||
        t.instrument.toLowerCase().includes(search.toLowerCase()) ||
        t.notes?.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        filterStatus === "ALL" || t.status === filterStatus;

      const matchSession =
        filterSession === "ALL" || t.session === filterSession;

      return matchSearch && matchStatus && matchSession;
    });

    // Group by date string (yyyy-MM-dd)
    const map = new Map<string, Trade[]>();
    for (const t of filtered) {
      const day = t.date;
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(t);
    }

    // Sort days descending
    return Array.from(map.entries()).sort(([a], [b]) =>
      b.localeCompare(a)
    );
  }, [trades, search, filterStatus, filterSession]);

  const sessions = Array.from(
    new Set(trades.map((t) => t.session).filter(Boolean))
  ) as string[];

  const totalPnl = trades.reduce((s, t) => s + t.profit_loss, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Journal</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {trades.length} trades ·{" "}
            <span className={totalPnl >= 0 ? "text-emerald-400" : "text-red-400"}>
              {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)} all time
            </span>
          </p>
        </div>
        <Button asChild>
          <Link href="/trades/new">+ New trade</Link>
        </Button>
      </div>

      {/* ── Filters ── */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2
                             h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
          <Input
            placeholder="Search instrument or notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-zinc-900 border-zinc-800"
          />
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 bg-zinc-900 border-zinc-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All results</SelectItem>
            <SelectItem value="WIN">Wins</SelectItem>
            <SelectItem value="LOSS">Losses</SelectItem>
            <SelectItem value="BREAKEVEN">Breakeven</SelectItem>
          </SelectContent>
        </Select>

        {sessions.length > 0 && (
          <Select value={filterSession} onValueChange={setFilterSession}>
            <SelectTrigger className="w-40 bg-zinc-900 border-zinc-800">
              <SelectValue placeholder="Session" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All sessions</SelectItem>
              {sessions.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* ── Trade list grouped by date ── */}
      {grouped.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50
                        p-12 text-center">
          <p className="text-zinc-500 text-sm">
            {trades.length === 0
              ? "No trades logged yet. Start by adding your first trade."
              : "No trades match your filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([date, dayTrades]) => {
            const dayPnl = dayTrades.reduce((s, t) => s + t.profit_loss, 0);

            return (
              <div key={date}>
                {/* Date header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-zinc-300">
                      {formatDayLabel(date)}
                    </p>
                    <span className="text-xs text-zinc-600">
                      {format(parseISO(date), "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-600">
                      {dayTrades.length} trade{dayTrades.length !== 1 ? "s" : ""}
                    </span>
                    <span className={cn(
                      "text-sm font-semibold tabular-nums",
                      dayPnl > 0 && "text-emerald-400",
                      dayPnl < 0 && "text-red-400",
                      dayPnl === 0 && "text-zinc-500",
                    )}>
                      {dayPnl >= 0 ? "+" : ""}${dayPnl.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Trade cards */}
                <div className="space-y-2">
                  {dayTrades.map((trade) => (
                    <TradeCard key={trade.id} trade={trade} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Trade card ────────────────────────────────────────────────────────────

function TradeCard({ trade }: { trade: Trade }) {
  const isWin  = trade.status === "WIN";
  const isLoss = trade.status === "LOSS";

  return (
    <Link href={`/trades/${trade.id}`}>
      <div className={cn(
        "group flex items-center gap-4 rounded-xl border px-4 py-3.5",
        "hover:bg-zinc-800/50 transition-all cursor-pointer",
        isWin  && "border-emerald-500/20 bg-emerald-500/5",
        isLoss && "border-red-500/20     bg-red-500/5",
        !isWin && !isLoss && "border-zinc-800 bg-zinc-900/50",
      )}>
        {/* Direction icon */}
        <div className={cn(
          "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
          isWin  && "bg-emerald-500/15",
          isLoss && "bg-red-500/15",
          !isWin && !isLoss && "bg-zinc-800",
        )}>
          {isWin
            ? <TrendingUp   className="h-4 w-4 text-emerald-400" />
            : isLoss
            ? <TrendingDown className="h-4 w-4 text-red-400" />
            : <Minus        className="h-4 w-4 text-zinc-500" />
          }
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-100">
              {trade.instrument}
            </span>
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded font-medium",
              trade.direction === "LONG"
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-red-500/10 text-red-400",
            )}>
              {trade.direction}
            </span>
            {trade.session && (
              <span className="text-xs text-zinc-600">{trade.session}</span>
            )}
          </div>
          {trade.notes && (
            <p className="text-xs text-zinc-500 mt-0.5 truncate max-w-md">
              {trade.notes}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 shrink-0 text-right">
          <div>
            <p className="text-xs text-zinc-600">RR</p>
            <p className="text-sm font-medium text-zinc-300">
              {trade.rr_ratio}R
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-600">P&L</p>
            <p className={cn(
              "text-sm font-bold tabular-nums",
              isWin  && "text-emerald-400",
              isLoss && "text-red-400",
              !isWin && !isLoss && "text-zinc-400",
            )}>
              {trade.profit_loss >= 0 ? "+" : ""}${trade.profit_loss.toFixed(2)}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-600
                                   group-hover:text-zinc-400 transition-colors" />
        </div>
      </div>
    </Link>
  );
}