"use client";

import { memo, useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart,
  type TooltipProps,
} from "recharts";
import { format, parseISO } from "date-fns";

// ── Types ─────────────────────────────────────────────────────────────────────

type ChartPoint = {
  date: string;
  daily_pnl: number;
  cumulative_pnl: number;
};

type Mode = "cumulative" | "daily";

// ── Custom Tooltip ────────────────────────────────────────────────────────────

const CustomTooltip = memo(({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload as ChartPoint;
  const isPositiveDaily = point.daily_pnl >= 0;

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-xs shadow-xl">
      <p className="mb-1.5 font-medium text-zinc-300">
        {format(parseISO(point.date), "MMM d, yyyy")}
      </p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-6">
          <span className="text-zinc-500">Daily PnL</span>
          <span className={isPositiveDaily ? "text-emerald-400" : "text-red-400"}>
            {isPositiveDaily ? "+" : ""}${point.daily_pnl.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-zinc-500">Cumulative</span>
          <span className="font-medium text-zinc-100">
            ${point.cumulative_pnl.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
});

CustomTooltip.displayName = "CustomTooltip";

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex h-[240px] flex-col items-center justify-center gap-2">
      <p className="text-sm text-zinc-500">No trades yet</p>
      <p className="text-xs text-zinc-600">Import a CSV to see your equity curve</p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

type PnlChartProps = {
  data: ChartPoint[];
};

export const PnlChart = memo(function PnlChart({ data }: PnlChartProps) {
  const [mode, setMode] = useState<Mode>("cumulative");

  // Derive color from final cumulative PnL — memoized so it doesn't recalculate on mode switch
  const { lineColor, gradientColor, isPositive } = useMemo(() => {
    const last = data[data.length - 1]?.cumulative_pnl ?? 0;
    const positive = last >= 0;
    return {
      isPositive: positive,
      lineColor: positive ? "#22c55e" : "#ef4444",
      gradientColor: positive ? "#22c55e" : "#ef4444",
    };
  }, [data]);

  // Format x-axis dates nicely
  const formatted = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        label: format(parseISO(d.date), "MMM d"),
      })),
    [data]
  );

  if (!data || data.length === 0) return <EmptyState />;

  const dataKey = mode === "cumulative" ? "cumulative_pnl" : "daily_pnl";
  const gradientId = "pnlGradient";

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex items-center gap-2">
        {(["cumulative", "daily"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              mode === m
                ? "bg-zinc-700 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {m === "cumulative" ? "Cumulative PnL" : "Daily PnL"}
          </button>
        ))}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={formatted} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={gradientColor} stopOpacity={0.15} />
              <stop offset="95%" stopColor={gradientColor} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#27272a"
            vertical={false}
          />

          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#71717a" }}
            axisLine={false}
            tickLine={false}
            dy={6}
          />

          <YAxis
            tick={{ fontSize: 11, fill: "#71717a" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${v}`}
            width={52}
          />

          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={lineColor}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={{ r: 3, fill: lineColor, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: lineColor, strokeWidth: 0 }}
            isAnimationActive={false}  // disable for perf — enable if you want the draw-in effect
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});