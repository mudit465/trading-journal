import Link from "next/link";
import type { Trade } from "@/types";
import { formatCurrency, getPnlColor, cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";

type RecentTradesProps = {
  trades: Trade[];
};

export function RecentTrades({ trades }: RecentTradesProps) {
  if (trades.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-600 text-sm">
        No trades yet.{" "}
        <Link href="/trades/new" className="text-indigo-400 hover:text-indigo-300">
          Log your first trade
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {trades.map((trade) => (
        <Link
          key={trade.id}
          href={`/trades/${trade.id}`}
          className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 hover:bg-zinc-800/50 transition-colors group"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-200 group-hover:text-zinc-100">{trade.instrument}</span>
              <Badge
                variant={
                  trade.direction === "LONG" ? "win" : "loss"
                }
                className="text-[10px] px-1.5 py-0"
              >
                {trade.direction}
              </Badge>
            </div>
            <p className="text-xs text-zinc-600 mt-0.5">{format(parseISO(trade.date), "MMM d")}</p>
          </div>
          <div className="text-right shrink-0">
            <p className={cn("text-sm font-semibold tabular-nums", getPnlColor(trade.profit_loss))}>
              {trade.profit_loss >= 0 ? "+" : ""}
              {formatCurrency(trade.profit_loss)}
            </p>
            <p className="text-xs text-zinc-600">{trade.rr_ratio}R</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
