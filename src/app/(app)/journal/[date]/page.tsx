import { getTradesByDate } from "@/lib/actions/trades";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { ChevronLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TradeCard } from "@/components/trades/trade-card";
import { formatCurrency, getPnlColor, cn } from "@/lib/utils";

type DayPageProps = {
  params: Promise<{ date: string }>;
};

export default async function DayPage({ params }: DayPageProps) {
  const { date } = await params;
  const trades = await getTradesByDate(date);

  const totalPnl = trades.reduce((s, t) => s + Number(t.profit_loss), 0);
  const wins = trades.filter((t) => t.status === "WIN").length;
  const losses = trades.filter((t) => t.status === "LOSS").length;

  let parsedDate: Date;
  try {
    parsedDate = parseISO(date);
  } catch {
    parsedDate = new Date();
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Back */}
      <Link
        href="/journal"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Journal
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">
            {format(parsedDate, "EEEE, MMMM d, yyyy")}
          </h1>
          {trades.length > 0 && (
            <div className="flex items-center gap-4 mt-1 text-sm text-zinc-500">
              <span className={cn("font-semibold", getPnlColor(totalPnl))}>
                {totalPnl >= 0 ? "+" : ""}
                {formatCurrency(totalPnl)}
              </span>
              <span>{trades.length} trades</span>
              <span className="text-emerald-400">{wins}W</span>
              <span className="text-red-400">{losses}L</span>
            </div>
          )}
        </div>
        <Button variant="primary" size="sm" asChild>
          <Link href={`/trades/new?date=${date}`}>
            <Plus className="h-4 w-4" />
            Add trade
          </Link>
        </Button>
      </div>

      {/* Trades */}
      {trades.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 py-16 text-center">
          <p className="text-zinc-600 text-sm">No trades on this day</p>
          <Button variant="ghost" size="sm" className="mt-3" asChild>
            <Link href={`/trades/new?date=${date}`}>
              <Plus className="h-4 w-4" />
              Log a trade
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {trades.map((trade) => (
            <TradeCard key={trade.id} trade={trade} />
          ))}
        </div>
      )}
    </div>
  );
}
