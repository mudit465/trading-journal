import { getTradeById } from "@/lib/actions/trades";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getPnlColor, cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { AiAnalysis } from "@/components/trades/ai-analysis";
import { DeleteTradeButton } from "@/components/trades/delete-trade-button";

type TradeDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TradeDetailPage({ params }: TradeDetailPageProps) {
  const { id } = await params;
  const trade = await getTradeById(id);

  if (!trade) notFound();

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href={`/journal/${trade.date}`}
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          {format(parseISO(trade.date), "MMM d")}
        </Link>
        <div className="flex items-center gap-2">
          <DeleteTradeButton tradeId={trade.id} date={trade.date} />
          <Button variant="outline" size="sm" asChild>
            <Link href={`/trades/${trade.id}/edit`}>
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Title */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-zinc-100">{trade.instrument}</h1>
              <Badge variant={trade.direction === "LONG" ? "win" : "loss"}>
                {trade.direction}
              </Badge>
              <Badge
                variant={
                  trade.status === "WIN" ? "win" : trade.status === "LOSS" ? "loss" : "breakeven"
                }
              >
                {trade.status}
              </Badge>
            </div>
            <p className="text-sm text-zinc-500 mt-1">
              {format(parseISO(trade.date), "EEEE, MMMM d, yyyy")}
              {trade.session && ` · ${trade.session}`}
            </p>
            {(trade.entry_time || trade.exit_time) && (
              <p className="text-xs text-zinc-600 mt-0.5">
                {trade.entry_time}{trade.exit_time ? ` → ${trade.exit_time}` : ""}
              </p>
            )}
          </div>
          <p className={cn("text-3xl font-bold tabular-nums", getPnlColor(trade.profit_loss))}>
            {trade.profit_loss >= 0 ? "+" : ""}
            {formatCurrency(trade.profit_loss)}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Risk", value: formatCurrency(trade.risk_amount) },
          { label: "RR Ratio", value: `${trade.rr_ratio}R` },
          { label: "SL", value: `${trade.sl_pips} pips` },
          { label: "TP", value: `${trade.tp_pips} pips` },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-center">
            <p className="text-xs text-zinc-500 mb-1">{stat.label}</p>
            <p className="text-sm font-semibold text-zinc-200">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* TP Levels */}
      {trade.tp_levels && trade.tp_levels.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="text-sm font-medium text-zinc-300 mb-3">Take profit levels</h2>
          <div className="space-y-2">
            {trade.tp_levels.map((tp) => (
              <div
                key={tp.level}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2 text-sm",
                  tp.hit ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-zinc-800/50 border border-zinc-700/50"
                )}
              >
                <span className="text-zinc-400">TP{tp.level}</span>
                <span className="text-zinc-200">{tp.pips} pips</span>
                {tp.price && <span className="text-zinc-500 text-xs">{tp.price}</span>}
                <Badge variant={tp.hit ? "win" : "default"} className="text-[10px]">
                  {tp.hit ? "Hit ✓" : "Not hit"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Concepts */}
      {trade.concepts && trade.concepts.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="text-sm font-medium text-zinc-300 mb-3">Concepts used</h2>
          <div className="flex flex-wrap gap-2">
            {trade.concepts.map((c) => (
              <span
                key={c}
                className="text-xs px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Attachments */}
      {trade.attachments && trade.attachments.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="text-sm font-medium text-zinc-300 mb-3">Attachments</h2>
          <div className="space-y-2">
            {trade.attachments.map((att) => (
              <a
                key={att.id}
                href={att.file_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 bg-zinc-800/50 rounded-lg px-3 py-2 transition-colors"
              >
                {att.file_name}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {trade.notes && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="text-sm font-medium text-zinc-300 mb-3">Notes</h2>
          <p className="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed">{trade.notes}</p>
        </div>
      )}

      <Separator />

      {/* AI Analysis */}
      <AiAnalysis trade={trade} />
    </div>
  );
}
