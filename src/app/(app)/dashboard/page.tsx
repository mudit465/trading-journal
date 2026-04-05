import { PnlCard } from "@/components/dashboard/pnl-card";
import { RecentTrades } from "@/components/dashboard/recent-trades";
import { PnlChart } from "@/components/dashboard/pnl-chart";
import { auth } from "@/lib/auth";
import { format } from "date-fns";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();

  // ✅ temporary dummy data (no Supabase)
  const stats = {
    daily: 0,
    weekly: 0,
    monthly: 0,
    yearly: 0,
    win_rate: 0,
    total_trades: 0,
    max_profit: 0,
    max_loss: 0,
  };

  const recentTrades = [];
  const chartData = [];

  // ✅ greeting INSIDE function
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

      {/* PnL Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <PnlCard label="Today" value={stats.daily} />
        <PnlCard label="This week" value={stats.weekly} />
        <PnlCard label="This month" value={stats.monthly} />
        <PnlCard label="This year" value={stats.yearly} />
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
            <ArrowUpRight className="h-4 w-4 text-emerald-400" />
            <p className="text-xl font-bold text-emerald-400">
              {formatCurrency(stats.max_profit)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500 mb-1">Worst trade</p>
          <div className="flex items-center gap-1">
            <ArrowDownRight className="h-4 w-4 text-red-400" />
            <p className="text-xl font-bold text-red-400">
              {formatCurrency(Math.abs(stats.max_loss))}
            </p>
          </div>
        </div>
      </div>

      {/* Chart + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <p className="text-sm font-medium text-zinc-300 mb-4">
            Equity curve (YTD)
          </p>
          <PnlChart data={chartData} />
        </div>

        <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <p className="text-sm font-medium text-zinc-300 mb-4">
            Recent trades
          </p>
          <RecentTrades trades={recentTrades} />
        </div>
      </div>
    </div>
  );
}