"use server";

import { auth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Trade, TradeFormData, DayStats, PnlStats } from "@/types";
import {
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, startOfYear, endOfYear,
  format,
} from "date-fns";

async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function createTrade(data: TradeFormData): Promise<Trade> {
  const userId = await getUserId();
  const supabase = await createClient();

  const { tp_levels, concepts, checklist, ...tradeData } = data;

  const { data: trade, error } = await supabase
    .from("trades")
    .insert({
      ...tradeData,
      user_id: userId,
      concepts: concepts ?? [],
      checklist: checklist ?? {},
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Insert TP levels
  if (tp_levels && tp_levels.length > 0) {
    await supabase.from("trade_tp_levels").insert(
      tp_levels.map((tp, i) => ({ ...tp, trade_id: trade.id, level: i + 1 }))
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/journal");
  return trade as Trade;
}

// ── Separate action for file uploads (receives FormData) ───────
export async function uploadTradeAttachments(
  tradeId: string,
  formData: FormData
): Promise<void> {
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated");

  const supabase = await createClient();
  const files = formData.getAll("files") as File[];

  for (const file of files) {
    if (!file || file.size === 0) continue;

    // Sanitize filename to avoid special character issues
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${userId}/${tradeId}/${Date.now()}_${safeName}`;

    const { data: uploaded, error: uploadError } = await supabase.storage
      .from("trade-attachments")
      .upload(path, file, { upsert: false });

    if (uploadError) {
      console.error("Upload error:", uploadError.message);
      continue;
    }

    if (uploaded) {
      const { data: urlData } = supabase.storage
        .from("trade-attachments")
        .getPublicUrl(path);

      await supabase.from("trade_attachments").insert({
        trade_id: tradeId,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_type: file.type,
      });
    }
  }

  revalidatePath(`/trades/${tradeId}`);
}

// ── Delete a single attachment ─────────────────────────────────
export async function deleteTradeAttachment(
  attachmentId: string,
  fileUrl: string,
  tradeId: string
): Promise<void> {
  const supabase = await createClient();

  // Extract storage path from public URL
  const url = new URL(fileUrl);
  const pathParts = url.pathname.split("/trade-attachments/");
  if (pathParts[1]) {
    await supabase.storage.from("trade-attachments").remove([pathParts[1]]);
  }

  await supabase.from("trade_attachments").delete().eq("id", attachmentId);
  revalidatePath(`/trades/${tradeId}`);
}

export async function updateTrade(id: string, data: Partial<TradeFormData>): Promise<void> {
  const userId = await getUserId();
  const supabase = await createClient();

  const { tp_levels, concepts, checklist, ...tradeData } = data;

  const { error } = await supabase
    .from("trades")
    .update({
      ...tradeData,
      concepts: concepts ?? [],
      checklist: checklist ?? {},
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  if (tp_levels) {
    await supabase.from("trade_tp_levels").delete().eq("trade_id", id);
    if (tp_levels.length > 0) {
      await supabase.from("trade_tp_levels").insert(
        tp_levels.map((tp, i) => ({ ...tp, trade_id: id, level: i + 1 }))
      );
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/journal");
  revalidatePath(`/trades/${id}`);
}

export async function deleteTrade(id: string): Promise<void> {
  const userId = await getUserId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("trades")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/journal");
}

export async function getTradeById(id: string): Promise<Trade | null> {
  const userId = await getUserId();
  const supabase = await createClient();

  const { data } = await supabase
    .from("trades")
    .select("*, trade_tp_levels(*), trade_attachments(*)")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  return data as Trade | null;
}

export async function getTradesByDate(date: string): Promise<Trade[]> {
  const userId = await getUserId();
  const supabase = await createClient();

  const { data } = await supabase
    .from("trades")
    .select("*, trade_tp_levels(*), trade_attachments(*)")
    .eq("user_id", userId)
    .eq("date", date)
    .order("entry_time", { ascending: true });

  return (data ?? []) as Trade[];
}

export async function getPnlStats(): Promise<PnlStats> {
  const userId = await getUserId();
  const supabase = await createClient();

  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");
  const yearStart = format(startOfYear(now), "yyyy-MM-dd");
  const yearEnd = format(endOfYear(now), "yyyy-MM-dd");

  const { data: allTrades } = await supabase
    .from("trades")
    .select("date, profit_loss, status")
    .eq("user_id", userId)
    .gte("date", yearStart)
    .lte("date", yearEnd);

  const trades = allTrades ?? [];
  const sum = (arr: typeof trades) => arr.reduce((s, t) => s + Number(t.profit_loss), 0);

  const daily   = sum(trades.filter((t) => t.date === today));
  const weekly  = sum(trades.filter((t) => t.date >= weekStart && t.date <= weekEnd));
  const monthly = sum(trades.filter((t) => t.date >= monthStart && t.date <= monthEnd));
  const yearly  = sum(trades);
  const wins    = trades.filter((t) => t.status === "WIN").length;
  const total_trades = trades.length;

  const { data: allTimeData } = await supabase
    .from("trades")
    .select("profit_loss")
    .eq("user_id", userId)
    .order("profit_loss", { ascending: false });

  const allPnls  = (allTimeData ?? []).map((t) => Number(t.profit_loss));
  const max_profit = allPnls.length ? Math.max(...allPnls) : 0;
  const max_loss   = allPnls.length ? Math.min(...allPnls) : 0;

  return {
    daily, weekly, monthly, yearly,
    max_profit, max_loss,
    win_rate: total_trades > 0 ? (wins / total_trades) * 100 : 0,
    total_trades,
  };
}

export async function getDayStats(year: number, month: number): Promise<DayStats[]> {
  const userId = await getUserId();
  const supabase = await createClient();

  const start = format(new Date(year, month - 1, 1), "yyyy-MM-dd");
  const end   = format(new Date(year, month, 0), "yyyy-MM-dd");

  const { data } = await supabase
    .from("trades")
    .select("date, profit_loss, status")
    .eq("user_id", userId)
    .gte("date", start)
    .lte("date", end);

  const map = new Map<string, DayStats>();
  for (const t of data ?? []) {
    const existing = map.get(t.date) ?? { date: t.date, total_pnl: 0, trade_count: 0, wins: 0, losses: 0 };
    existing.total_pnl   += Number(t.profit_loss);
    existing.trade_count += 1;
    if (t.status === "WIN")  existing.wins   += 1;
    if (t.status === "LOSS") existing.losses += 1;
    map.set(t.date, existing);
  }

  return Array.from(map.values());
}

export async function getRecentTrades(limit = 10): Promise<Trade[]> {
  const userId = await getUserId();
  const supabase = await createClient();

  const { data } = await supabase
    .from("trades")
    .select("*, trade_tp_levels(*)")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as Trade[];
}

export async function getPnlChartData(): Promise<{ date: string; pnl: number; cumulative: number }[]> {
  const userId = await getUserId();
  const supabase = await createClient();

  const yearStart = format(startOfYear(new Date()), "yyyy-MM-dd");

  const { data } = await supabase
    .from("trades")
    .select("date, profit_loss")
    .eq("user_id", userId)
    .gte("date", yearStart)
    .order("date", { ascending: true });

  const dayMap = new Map<string, number>();
  for (const t of data ?? []) {
    dayMap.set(t.date, (dayMap.get(t.date) ?? 0) + Number(t.profit_loss));
  }

  let cumulative = 0;
  return Array.from(dayMap.entries()).map(([date, pnl]) => {
    cumulative += pnl;
    return { date, pnl, cumulative };
  });
}