"use server";

import { createClient } from "@/lib/supabase/server";
import { auth } from "@/lib/auth";
import { generateAIInsights } from "@/lib/ai/groq";

const FALLBACK_INSIGHTS = [
  "Focus on improving risk management across all trades.",
  "Maintain consistent position sizing to protect capital.",
  "Avoid overtrading after consecutive losses.",
];

async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function getAIInsights(): Promise<string[]> {
  try {
    const userId = await getUserId();
    if (!userId) return FALLBACK_INSIGHTS;

    const supabase = await createClient();

    const { data: trades, error } = await supabase
      .from("trades")
      .select("date, instrument, profit_loss, status, direction, rr_ratio")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(20);

    if (error || !trades || trades.length === 0) return FALLBACK_INSIGHTS;

    const totalPnl = trades.reduce((s, t) => s + Number(t.profit_loss), 0);
    const wins = trades.filter((t) => t.status === "WIN").length;
    const winRate = ((wins / trades.length) * 100).toFixed(0);

    const avgRR =
      trades.reduce((s, t) => s + Number(t.rr_ratio || 0), 0) /
      trades.length;

    const instruments = [...new Set(trades.map((t) => t.instrument))].join(", ");

    const summary = [
      `Total trades: ${trades.length}`,
      `Win rate: ${winRate}%`,
      `Total PnL: $${totalPnl.toFixed(2)}`,
      `Avg R:R ratio: ${avgRR.toFixed(2)}`,
      `Instruments traded: ${instruments}`,
      `Recent results: ${trades
        .slice(0, 5)
        .map((t) => `${t.instrument} ${t.status} $${t.profit_loss}`)
        .join(", ")}`,
    ].join("\n");

    const insights = await generateAIInsights(summary);

    if (!Array.isArray(insights) || insights.length === 0) {
      return FALLBACK_INSIGHTS;
    }

    return insights;
  } catch (err) {
    console.error("[getAIInsights] Unexpected error:", err);
    return FALLBACK_INSIGHTS;
  }
}