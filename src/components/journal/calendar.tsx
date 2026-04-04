"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  format,
  getDaysInMonth,
  startOfMonth,
  getDay,
  parseISO,
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

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function JournalCalendar({ year, month, dayStats }: JournalCalendarProps) {
  const router = useRouter();
  const date = new Date(year, month - 1, 1);
  const daysInMonth = getDaysInMonth(date);
  // Monday-based week start offset
  let startOffset = getDay(startOfMonth(date)) - 1;
  if (startOffset < 0) startOffset = 6;

  const statsMap = new Map(dayStats.map((d) => [d.date, d]));

  const navigate = (dir: -1 | 1) => {
    const next = dir === 1 ? addMonths(date, 1) : subMonths(date, 1);
    router.push(`/journal?year=${next.getFullYear()}&month=${next.getMonth() + 1}`);
  };

  const totalPnl = dayStats.reduce((s, d) => s + d.total_pnl, 0);
  const totalTrades = dayStats.reduce((s, d) => s + d.trade_count, 0);
  const winDays = dayStats.filter((d) => d.total_pnl > 0).length;
  const lossDays = dayStats.filter((d) => d.total_pnl < 0).length;

  return (
    <div className="space-y-4">
      {/* Month header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">{format(date, "MMMM yyyy")}</h2>
          <div className="flex items-center gap-4 mt-1 text-xs text-zinc-500">
            <span className={cn("font-medium", getPnlColor(totalPnl))}>
              {totalPnl >= 0 ? "+" : ""}
              {formatCurrency(totalPnl)}
            </span>
            <span>{totalTrades} trades</span>
            <span className="text-emerald-500">{winDays}W</span>
            <span className="text-red-400">{lossDays}L</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/journal?year=${new Date().getFullYear()}&month=${new Date().getMonth() + 1}`)}
            className="text-xs"
          >
            Today
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-zinc-800">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-2 text-center text-xs font-medium text-zinc-600">
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-zinc-900/50" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = format(new Date(year, month - 1, day), "yyyy-MM-dd");
            const stats = statsMap.get(dateStr);
            const isCurrentDay = isToday(new Date(year, month - 1, day));
            const hasTrades = stats && stats.trade_count > 0;

            return (
              <Link
                key={day}
                href={`/journal/${dateStr}`}
                className={cn(
                  "min-h-[80px] p-2 border-b border-r border-zinc-900/50 flex flex-col transition-colors group",
                  "hover:bg-zinc-800/30",
                  hasTrades && stats.total_pnl > 0 && "bg-emerald-500/3",
                  hasTrades && stats.total_pnl < 0 && "bg-red-500/3",
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isCurrentDay
                        ? "h-5 w-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px]"
                        : hasTrades ? "text-zinc-300" : "text-zinc-600"
                    )}
                  >
                    {day}
                  </span>
                  {hasTrades && (
                    <span className="text-[10px] text-zinc-600">{stats.trade_count}T</span>
                  )}
                </div>
                {hasTrades && (
                  <div className="mt-auto">
                    <div
                      className={cn(
                        "text-[11px] font-semibold tabular-nums",
                        stats.total_pnl > 0 ? "text-emerald-400" : stats.total_pnl < 0 ? "text-red-400" : "text-zinc-500"
                      )}
                    >
                      {stats.total_pnl >= 0 ? "+" : ""}
                      {formatCurrency(stats.total_pnl)}
                    </div>
                    <div className="flex gap-0.5 mt-1">
                      {stats.wins > 0 && (
                        <div
                          className="h-1 rounded-full bg-emerald-500"
                          style={{ width: `${(stats.wins / stats.trade_count) * 100}%` }}
                        />
                      )}
                      {stats.losses > 0 && (
                        <div
                          className="h-1 rounded-full bg-red-500"
                          style={{ width: `${(stats.losses / stats.trade_count) * 100}%` }}
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
