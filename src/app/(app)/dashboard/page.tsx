// src/app/(app)/dashboard/page.tsx
import { getPnlStats, getRecentTrades, getPnlChartData } from "@/lib/actions/trades";
import { PnlCard } from "@/components/dashboard/pnl-card";
import { RecentTrades } from "@/components/dashboard/recent-trades";
import { PnlChart } from "@/components/dashboard/pnl-chart";
import { AIInsights } from "@/components/dashboard/ai-insights";
import { auth } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { CSVImport } from "@/components/csv-import";
import { generateAIInsights } from "@/lib/ai/groq";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [session, stats, recentTrades, chartData] = await Promise.all([
    auth(),
    getPnlStats(),
    getRecentTrades(5),
    getPnlChartData(),
  ]);

  const summary = `
Win rate: ${stats.win_rate}%
Avg win: ${stats.avg_win}
Avg loss: ${stats.avg_loss}
Expectancy: ${stats.expectancy}
Max drawdown: ${stats.max_drawdown}
Total trades: ${stats.total_trades}
`;

  const insight = await generateAIInsights(summary);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    /*
     * px-4 sm:px-6 — breathing room on mobile, slightly more on tablet+
     * py-5 sm:py-6 — tighter vertical rhythm on mobile
     * max-w-6xl mx-auto — cap width on ultra-wide, stay centered
     * w-full — never exceed the parent (overflow guard)
     */
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-6 animate-fade-in">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div>
        <p className="text-zinc-500 text-sm">
          {format(new Date(), "EEEE, MMMM d")}
        </p>
        <h1 className="text-xl font-semibold text-zinc-100 mt-0.5">
          {greeting()}, {session?.user?.name?.split(" ")[0] ?? "trader"} 👋
        </h1>
      </div>

      {/* ── Historical data banner ───────────────────────────────────── */}
      {stats.latest_trade &&
        stats.latest_trade !== format(new Date(), "yyyy-MM-dd") && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2 text-xs text-amber-400">
            Showing stats relative to your latest trade on{" "}
            <span className="font-medium">{stats.latest_trade}</span>
          </div>
        )}

      {/* ── Period PnL grid ─────────────────────────────────────────── */}
      {/*
       * BREAKPOINTS:
       *   mobile  (default) : 1 col — full-width, easy to read on small screens
       *   sm (≥640px)       : 2 col — phone landscape / small tablets
       *   lg (≥1024px)      : 4 col — desktop
       *
       * Previously this was grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
       * which left the 4th card orphaned. Now it's symmetric.
       */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <PnlCard label="Today"      value={stats.daily}   />
        <PnlCard label="This week"  value={stats.weekly}  />
        <PnlCard label="This month" value={stats.monthly} />
        <PnlCard label="This year"  value={stats.yearly}  />
      </div>

      {/* ── Advanced Statistics ──────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
          Advanced statistics
        </p>

        {/*
         * Previously grid-cols-2 lg:grid-cols-3 — on narrow phones the
         * 2-col layout makes cards very narrow (≈160px) and overflows.
         * Fix: start 1-col, go 2-col at sm, 3-col at lg.
         */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <PnlCard label="Avg win"     value={stats.avg_win     ?? 0} />
          <PnlCard label="Avg loss"    value={stats.avg_loss    ?? 0} />
          <PnlCard label="Expectancy"  value={stats.expectancy  ?? 0} />

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-xs text-zinc-500 mb-1">Max drawdown</p>
            <p className="text-xl font-bold text-red-400 tabular-nums">
              −${(stats.max_drawdown ?? 0).toFixed(2)}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-xs text-zinc-500 mb-1">Max win streak</p>
            <p className="text-xl font-bold text-zinc-100">
              {stats.max_win_streak ?? 0}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-xs text-zinc-500 mb-1">Max loss streak</p>
            <p className="text-xl font-bold text-zinc-100">
              {stats.max_loss_streak ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats Row ───────────────────────────────────────────────── */}
      {/*
       * Previously grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 which left
       * the 4th card (Worst trade) orphaned on desktop.
       * Fix: symmetric 4-col on lg.
       */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500 mb-1">Win rate</p>
          <p className="text-2xl font-bold text-zinc-100 tabular-nums">
            {stats.win_rate.toFixed(0)}%
          </p>
          <p className="text-xs text-zinc-600 mt-1">{stats.total_trades} trades</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500 mb-1">Total trades</p>
          <p className="text-2xl font-bold text-zinc-100 tabular-nums">
            {stats.total_trades}
          </p>
          <p className="text-xs text-zinc-600 mt-1">all time</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500 mb-1">Best trade</p>
          <div className="flex items-center gap-1 min-w-0">
            <ArrowUpRight className="h-4 w-4 text-emerald-400 shrink-0" />
            <p className="text-xl font-bold text-emerald-400 tabular-nums truncate">
              {formatCurrency(stats.max_profit)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500 mb-1">Worst trade</p>
          <div className="flex items-center gap-1 min-w-0">
            <ArrowDownRight className="h-4 w-4 text-red-400 shrink-0" />
            <p className="text-xl font-bold text-red-400 tabular-nums truncate">
              {formatCurrency(Math.abs(stats.max_loss))}
            </p>
          </div>
        </div>
      </div>

      {/* ── Chart + AI + Recent Trades ──────────────────────────────── */}
      {/*
       * On mobile: stacked (1 col).
       * On lg+: chart takes 3/5, right column takes 2/5.
       * items-start stops the right column from stretching to chart height.
       */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">

        {/* Equity Curve */}
        <div className="lg:col-span-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-zinc-300 truncate">
              Equity curve (All time)
            </p>
            {chartData.length > 0 && (
              <span
                className={`text-sm font-semibold shrink-0 tabular-nums ${
                  chartData[chartData.length - 1].cumulative_pnl >= 0
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                ${chartData[chartData.length - 1].cumulative_pnl.toFixed(2)}
              </span>
            )}
          </div>
          {/* Chart itself is already responsive via ResponsiveContainer */}
          <PnlChart data={chartData} />
        </div>

        {/* Right column — AI Coach + Recent Trades */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          <AIInsights
            initialInsight={Array.isArray(insight) ? insight.join("\n") : insight}
            stats={stats}
          />

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 mb-4">
              <p className="text-sm font-medium text-zinc-300">Recent trades</p>
              <CSVImport />
            </div>

            {recentTrades.length === 0 ? (
              <div className="text-sm text-zinc-600 py-10 text-center">
                No trades yet — import a CSV to get started.
              </div>
            ) : (
              <RecentTrades trades={recentTrades} />
            )}
          </div>

        </div>
      </div>
    </div>
  );
}