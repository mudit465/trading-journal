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

// ─────────────────────────────────────────────────────────────────────────────
// CREATE TRADE
// ─────────────────────────────────────────────────────────────────────────────
export async function createTrade(data: TradeFormData): Promise<Trade> {
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated"); // FIX 1

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

  if (tp_levels && tp_levels.length > 0) {
    const { error: tpError } = await supabase.from("trade_tp_levels").insert(
      tp_levels.map((tp, i) => ({ ...tp, trade_id: trade.id, level: i + 1 }))
    );
    if (tpError) console.error("TP insert error:", tpError.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/journal");
  revalidatePath("/trades"); // FIX 2
  return trade as Trade;
}

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD TRADE ATTACHMENTS
//
// ─────────────────────────────────────────────────────────────────────────────
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

      if (!urlData?.publicUrl) {
        console.error("Failed to get public URL");
        continue; // FIX 3a: don't throw — skip this file and continue with others
      }

      const { error: attachmentError } = await supabase
        .from("trade_attachments")
        .insert({
          trade_id: tradeId,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_type: file.type,
        });

      if (attachmentError) {
        console.error("Attachment insert error:", attachmentError.message);
        // FIX 3b: don't throw mid-loop — log and continue uploading remaining files
      }
    }
  } // FIX 3c: revalidatePath moved here — runs ONCE after all files processed, not per file

  revalidatePath(`/trades/${tradeId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE ATTACHMENT
// (no bugs — kept as-is)
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteTradeAttachment(
  attachmentId: string,
  fileUrl: string,
  tradeId: string
): Promise<void> {
  const supabase = await createClient();

  const url = new URL(fileUrl);
  const pathParts = url.pathname.split("/trade-attachments/");
  if (pathParts[1]) {
    await supabase.storage.from("trade-attachments").remove([pathParts[1]]);
  }

  await supabase.from("trade_attachments").delete().eq("id", attachmentId);
  revalidatePath(`/trades/${tradeId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE TRADE
// 
// ─────────────────────────────────────────────────────────────────────────────
export async function updateTrade(id: string, data: Partial<TradeFormData>): Promise<void> {
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated"); // FIX 4

  const supabase = await createClient();

  const { tp_levels, concepts, checklist, ...tradeData } = data;

  const { error } = await supabase
    .from("trades")
    .update({
      ...tradeData,
      // FIX 5: only include concepts/checklist if they were explicitly passed
      ...(concepts !== undefined && { concepts }),
      ...(checklist !== undefined && { checklist }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  if (tp_levels !== undefined) {
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

// ─────────────────────────────────────────────────────────────────────────────
// DELETE TRADE
//
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteTrade(id: string): Promise<void> {
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated"); // FIX 6

  const supabase = await createClient();

  
  await supabase.from("trade_tp_levels").delete().eq("trade_id", id);
  await supabase.from("trade_attachments").delete().eq("trade_id", id);

  const { error } = await supabase
    .from("trades")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/journal");
  revalidatePath("/trades");
}

// ─────────────────────────────────────────────────────────────────────────────
// GET TRADE BY ID
// (safe — returns null on error already via .single() returning null data)
// ─────────────────────────────────────────────────────────────────────────────
export async function getTradeById(id: string): Promise<Trade | null> {
  const userId = await getUserId();
  if (!userId) return null;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("trades")
    .select("*, trade_tp_levels(*), trade_attachments(*)")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  // PGRST116 = row not found — return null gracefully instead of throwing
  if (error) {
    if (error.code !== "PGRST116") console.error("getTradeById:", error.message);
    return null;
  }

  return data as Trade | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET TRADES BY DATE
// ─────────────────────────────────────────────────────────────────────────────
export async function getTradesByDate(date: string): Promise<Trade[]> {
  const userId = await getUserId();
  if (!userId) return [];
  const supabase = await createClient();

  const { data } = await supabase
    .from("trades")
    .select("*, trade_tp_levels(*), trade_attachments(*)")
    .eq("user_id", userId)
    .eq("date", date)
    .order("entry_time", { ascending: true });

  return (data ?? []) as Trade[];
}

// ─────────────────────────────────────────────────────────────────────────────
// GET PNL STATS
// ─────────────────────────────────────────────────────────────────────────────
export async function getPnlStats(): Promise<PnlStats> {
  const userId = await getUserId();
  if (!userId) return {
    daily: 0, weekly: 0, monthly: 0, yearly: 0,
    max_profit: 0, max_loss: 0, win_rate: 0, total_trades: 0,
  };
  const supabase = await createClient();

  const now = new Date();
  const today      = format(now, "yyyy-MM-dd");
  const weekStart  = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd    = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd   = format(endOfMonth(now), "yyyy-MM-dd");
  const yearStart  = format(startOfYear(now), "yyyy-MM-dd");
  const yearEnd    = format(endOfYear(now), "yyyy-MM-dd");

  const { data: allTrades } = await supabase
    .from("trades")
    .select("date, profit_loss, status")
    .eq("user_id", userId)
    .gte("date", yearStart)
    .lte("date", yearEnd);

  const trades = allTrades ?? [];
  const sum = (arr: typeof trades) =>
    arr.reduce((s, t) => s + Number(t.profit_loss), 0);

  const daily   = sum(trades.filter((t) => t.date === today));
  const weekly  = sum(trades.filter((t) => t.date >= weekStart && t.date <= weekEnd));
  const monthly = sum(trades.filter((t) => t.date >= monthStart && t.date <= monthEnd));
  const yearly  = sum(trades);
  const wins    = trades.filter((t) => t.status === "WIN").length;
  const total_trades = trades.length;

  // Fetch all-time for max profit/loss (not just this year)
  const { data: allTimeData } = await supabase
    .from("trades")
    .select("profit_loss")
    .eq("user_id", userId);

  const allPnls    = (allTimeData ?? []).map((t) => Number(t.profit_loss));
  const max_profit = allPnls.length ? Math.max(...allPnls) : 0;
  const max_loss   = allPnls.length ? Math.min(...allPnls) : 0;

  return {
    daily, weekly, monthly, yearly,
    max_profit, max_loss,
    win_rate: total_trades > 0 ? (wins / total_trades) * 100 : 0,
    total_trades,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET DAY STATS
// ─────────────────────────────────────────────────────────────────────────────
export async function getDayStats(year: number, month: number): Promise<DayStats[]> {
  const userId = await getUserId();
  if (!userId) return [];
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
    const existing = map.get(t.date) ?? {
      date: t.date, total_pnl: 0, trade_count: 0, wins: 0, losses: 0,
    };
    existing.total_pnl   += Number(t.profit_loss);
    existing.trade_count += 1;
    if (t.status === "WIN")  existing.wins   += 1;
    if (t.status === "LOSS") existing.losses += 1;
    map.set(t.date, existing);
  }

  return Array.from(map.values());
}

// ─────────────────────────────────────────────────────────────────────────────
// GET RECENT TRADES
// ─────────────────────────────────────────────────────────────────────────────
export async function getRecentTrades(limit = 10): Promise<Trade[]> {
  const userId = await getUserId();
  if (!userId) return [];
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

// ─────────────────────────────────────────────────────────────────────────────
// GET PNL CHART DATA
// ─────────────────────────────────────────────────────────────────────────────
export async function getPnlChartData(): Promise<
  { date: string; pnl: number; cumulative: number }[]
> {
  const userId = await getUserId();
  if (!userId) return [];
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