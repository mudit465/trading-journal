// src/app/(dashboard)/page.tsx

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

  // 🔥 Build AI summary
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
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">

      {/* Header */}
      <div>
        <p className="text-zinc-500 text-sm">
          {format(new Date(), "EEEE, MMMM d")}
        </p>
        <h1 className="text-xl font-semibold text-zinc-100 mt-0.5">
          {greeting()}, {session?.user?.name?.split(" ")[0] ?? "trader"} 👋
        </h1>
      </div>

      {/* Historical data banner */}
      {stats.latest_trade &&
        stats.latest_trade !== format(new Date(), "yyyy-MM-dd") && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2 text-xs text-amber-400">
            Showing stats relative to your latest trade on{" "}
            <span className="font-medium">{stats.latest_trade}</span>
          </div>
        )}

      {/* PnL Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <PnlCard label="Today" value={stats.daily} />
        <PnlCard label="This week" value={stats.weekly} />
        <PnlCard label="This month" value={stats.monthly} />
        <PnlCard label="This year" value={stats.yearly} />
      </div>

      {/* Advanced Statistics */}
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-8 mb-3">
        Advanced statistics
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <PnlCard label="Avg win" value={stats.avg_win ?? 0} />
        <PnlCard label="Avg loss" value={stats.avg_loss ?? 0} />
        <PnlCard label="Expectancy" value={stats.expectancy ?? 0} />

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500 mb-1">Max drawdown</p>
          <p className="text-xl font-bold text-red-400">
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

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500 mb-1">Win rate</p>
          <p className="text-2xl font-bold text-zinc-100">
            {stats.win_rate.toFixed(0)}%
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            {stats.total_trades} trades
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500 mb-1">Total trades</p>
          <p className="text-2xl font-bold text-zinc-100">
            {stats.total_trades}
          </p>
          <p className="text-xs text-zinc-600 mt-1">all time</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500 mb-1">Best trade</p>
          <div className="flex items-center gap-1">
            <ArrowUpRight className="h-4 w-4 text-emerald-400 shrink-0" />
            <p className="text-xl font-bold text-emerald-400">
              {formatCurrency(stats.max_profit)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500 mb-1">Worst trade</p>
          <div className="flex items-center gap-1">
            <ArrowDownRight className="h-4 w-4 text-red-400 shrink-0" />
            <p className="text-xl font-bold text-red-400">
              {formatCurrency(Math.abs(stats.max_loss))}
            </p>
          </div>
        </div>
      </div>

      {/* Chart + AI + Recent Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">

        {/* Equity Curve */}
        <div className="lg:col-span-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-300">
              Equity curve (All time)
            </p>
            {chartData.length > 0 && (
              <span
                className={`text-sm font-semibold ${
                  chartData[chartData.length - 1].cumulative_pnl >= 0
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                ${chartData[chartData.length - 1].cumulative_pnl.toFixed(2)}
              </span>
            )}
          </div>
          <PnlChart data={chartData} />
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* 🤖 AI Coach */}
          <AIInsights 
            initialInsight={insight} 
            stats={stats} 
          />

          {/* Recent Trades */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-zinc-300">
                Recent trades
              </p>
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