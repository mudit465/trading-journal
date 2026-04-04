import { formatCurrency, getPnlColor } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type PnlCardProps = {
  label: string;
  value: number;
};

export function PnlCard({ label, value }: PnlCardProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">{label}</p>
        <div
          className={cn(
            "h-6 w-6 rounded-md flex items-center justify-center",
            isPositive ? "bg-emerald-500/10" : isNegative ? "bg-red-500/10" : "bg-zinc-800"
          )}
        >
          <Icon
            className={cn(
              "h-3 w-3",
              isPositive ? "text-emerald-400" : isNegative ? "text-red-400" : "text-zinc-500"
            )}
          />
        </div>
      </div>
      <p className={cn("text-2xl font-bold tabular-nums", getPnlColor(value))}>
        {value >= 0 ? "+" : ""}
        {formatCurrency(value)}
      </p>
    </div>
  );
}
