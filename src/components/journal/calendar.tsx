"use client";

import { useRouter } from "next/navigation";
import {
  format,
  getDaysInMonth,
  startOfMonth,
  getDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency, getPnlColor } from "@/lib/utils";
import type { DayStats } from "@/types";
import Link from "next/link";

type JournalCalendarProps = {
  year: number;
  month: number;
  dayStats: DayStats[];
};

// BUG FIX 1: Show single-letter labels on mobile (Mon→M) so 7 columns
// don't squish. Full labels visible on sm+ screens.
const WEEKDAYS_SHORT = ["M", "T", "W", "T", "F", "S", "S"];
const WEEKDAYS_FULL  = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function JournalCalendar({ year, month, dayStats }: JournalCalendarProps) {
  const router = useRouter();
  const date = new Date(year, month - 1, 1);
  const daysInMonth = getDaysInMonth(date);

  // Monday-based week start offset (0=Mon … 6=Sun)
  let startOffset = getDay(startOfMonth(date)) - 1;
  if (startOffset < 0) startOffset = 6;

  const statsMap = new Map(dayStats.map((d) => [d.date, d]));

  const navigate = (dir: -1 | 1) => {
    const next = dir === 1 ? addMonths(date, 1) : subMonths(date, 1);
    router.push(`/journal?year=${next.getFullYear()}&month=${next.getMonth() + 1}`);
  };

  const totalPnl    = dayStats.reduce((s, d) => s + d.total_pnl,    0);
  const totalTrades = dayStats.reduce((s, d) => s + d.trade_count,  0);
  const winDays     = dayStats.filter((d) => d.total_pnl > 0).length;
  const lossDays    = dayStats.filter((d) => d.total_pnl < 0).length;

  return (
    <div className="space-y-4">

      {/* ── Month header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-zinc-100">
            {format(date, "MMMM yyyy")}
          </h2>
          {/* BUG FIX 2: flex-wrap so stats don't overflow on narrow screens */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-zinc-500">
            <span className={cn("font-medium", getPnlColor(totalPnl))}>
              {totalPnl >= 0 ? "+" : ""}
              {formatCurrency(totalPnl)}
            </span>
            <span>{totalTrades} trades</span>
            <span className="text-emerald-500">{winDays}W</span>
            <span className="text-red-400">{lossDays}L</span>
          </div>
        </div>

        {/* Nav buttons — flex-shrink-0 so they never collapse */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              router.push(
                `/journal?year=${new Date().getFullYear()}&month=${new Date().getMonth() + 1}`
              )
            }
            className="text-xs px-2"
          >
            Today
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Calendar grid ─────────────────────────────────────────── */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-zinc-800">
          {WEEKDAYS_FULL.map((day, i) => (
            <div
              key={day + i}
              className="py-2 text-center text-xs font-medium text-zinc-600 select-none"
            >
              {/* BUG FIX 1: single letter on mobile, full label on sm+ */}
              <span className="sm:hidden">{WEEKDAYS_SHORT[i]}</span>
              <span className="hidden sm:inline">{WEEKDAYS_FULL[i]}</span>
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">

          {/* Empty offset cells */}
          {Array.from({ length: startOffset }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="min-h-[70px] sm:min-h-[80px] border-b border-r border-zinc-900/50"
            />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day     = i + 1;
            const dateStr = format(new Date(year, month - 1, day), "yyyy-MM-dd");
            const stats   = statsMap.get(dateStr);
            const isCurrentDay = isToday(new Date(year, month - 1, day));
            const hasTrades    = stats && stats.trade_count > 0;

            return (
              <Link
                key={day}
                href={`/journal/${dateStr}`}
                className={cn(
                  // BUG FIX 3: overflow-hidden clips PnL text inside the cell.
                  // p-1 on mobile (was p-2 — too wide for ~55px cell).
                  // min-h shrinks slightly on mobile to give cells more breathing room.
                  "min-h-[70px] sm:min-h-[80px] p-1 sm:p-2",
                  "border-b border-r border-zinc-900/50",
                  "flex flex-col transition-colors group overflow-hidden",
                  "hover:bg-zinc-800/30",
                  hasTrades && stats.total_pnl > 0 && "bg-emerald-500/[0.03]",
                  hasTrades && stats.total_pnl < 0 && "bg-red-500/[0.03]",
                )}
              >
                {/* Day number row */}
                <div className="flex items-start justify-between gap-0.5">
                  <span
                    className={cn(
                      "text-[11px] sm:text-xs font-medium leading-none shrink-0",
                      isCurrentDay
                        ? "h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[9px] sm:text-[10px]"
                        : hasTrades
                          ? "text-zinc-300"
                          : "text-zinc-600"
                    )}
                  >
                    {day}
                  </span>
                  {hasTrades && (
                    // BUG FIX 4: trade count badge — hidden on very small cells
                    // to avoid fighting with the day number
                    <span className="hidden sm:inline text-[10px] text-zinc-600 shrink-0">
                      {stats.trade_count}T
                    </span>
                  )}
                </div>

                {/* PnL + win/loss bar */}
                {hasTrades && (
                  <div className="mt-auto pt-1">
                    {/*
                     * BUG FIX 3 (core):
                     * Was text-[11px] with no truncation — at ~55px cell width,
                     * "-$9,266.00" (~65px) overflowed into the adjacent cell.
                     *
                     * Fix:
                     *  - text-[9px] on mobile  (fits within ~55px)
                     *  - text-[10px] on sm+
                     *  - truncate → clips with ellipsis instead of overflowing
                     *  - w-full min-w-0 → ensures the text respects the cell boundary
                     */}
                    <div
                      className={cn(
                        "w-full min-w-0 truncate",
                        "text-[9px] sm:text-[10px] font-semibold tabular-nums leading-tight",
                        stats.total_pnl > 0
                          ? "text-emerald-400"
                          : stats.total_pnl < 0
                            ? "text-red-400"
                            : "text-zinc-500"
                      )}
                    >
                      {stats.total_pnl >= 0 ? "+" : ""}
                      {formatCurrency(stats.total_pnl)}
                    </div>

                    {/* Win/loss bar */}
                    <div className="flex gap-0.5 mt-1 w-full overflow-hidden rounded-full">
                      {stats.wins > 0 && (
                        <div
                          className="h-0.5 sm:h-1 rounded-full bg-emerald-500 shrink-0"
                          style={{
                            width: `${(stats.wins / stats.trade_count) * 100}%`,
                          }}
                        />
                      )}
                      {stats.losses > 0 && (
                        <div
                          className="h-0.5 sm:h-1 rounded-full bg-red-500 shrink-0"
                          style={{
                            width: `${(stats.losses / stats.trade_count) * 100}%`,
                          }}
                        />
                      )}
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}