"use client";

import Link from "next/link";
import type { Trade } from "@/types";
import { formatCurrency, getPnlColor, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Paperclip, Clock } from "lucide-react";

type TradeCardProps = {
  trade: Trade;
};

export function TradeCard({ trade }: TradeCardProps) {
  return (
    <Link
      href={`/trades/${trade.id}`}
      className="block rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-700 transition-colors group"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-zinc-100 text-sm">{trade.instrument}</span>
            <Badge variant={trade.direction === "LONG" ? "win" : "loss"} className="text-[10px]">
              {trade.direction}
            </Badge>
            <Badge
              variant={
                trade.status === "WIN" ? "win" : trade.status === "LOSS" ? "loss" : "breakeven"
              }
              className="text-[10px]"
            >
              {trade.status}
            </Badge>
            {trade.session && (
              <Badge variant="default" className="text-[10px]">
                {trade.session}
              </Badge>
            )}
          </div>

          {/* Concepts */}
          {trade.concepts && trade.concepts.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {trade.concepts.map((c) => (
                <span
                  key={c}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                >
                  {c}
                </span>
              ))}
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
            <span>RR: {trade.rr_ratio}R</span>
            <span>SL: {trade.sl_pips} pips</span>
            <span>TP: {trade.tp_pips} pips</span>
            <span>Risk: {formatCurrency(trade.risk_amount)}</span>
          </div>

          {/* Timing */}
          {(trade.entry_time || trade.exit_time) && (
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-zinc-600">
              <Clock className="h-3 w-3" />
              {trade.entry_time}
              {trade.exit_time && ` → ${trade.exit_time}`}
            </div>
          )}

          {/* Attachments indicator */}
          {trade.attachments && trade.attachments.length > 0 && (
            <div className="flex items-center gap-1 mt-1.5 text-xs text-zinc-600">
              <Paperclip className="h-3 w-3" />
              {trade.attachments.length} attachment{trade.attachments.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* Right */}
        <div className="text-right shrink-0 flex items-center gap-2">
          <div>
            <p className={cn("text-lg font-bold tabular-nums", getPnlColor(trade.profit_loss))}>
              {trade.profit_loss >= 0 ? "+" : ""}
              {formatCurrency(trade.profit_loss)}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-700 group-hover:text-zinc-500 transition-colors" />
        </div>
      </div>
    </Link>
  );
}
