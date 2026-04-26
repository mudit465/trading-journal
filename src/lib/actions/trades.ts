"use server";


import { createClient } from "@/lib/supabase/server";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { format, parseISO } from "date-fns";

// ─────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────
async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

// ─────────────────────────────────────────────
// GET TRADE BY ID (for trade detail page)
// ─────────────────────────────────────────────
export async function getTradeById(id: string) {
  const userId = await getUserId();
  if (!userId) return null;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error(error.message);
    return null;
  }

  return data;
}

// ─────────────────────────────────────────────
// GET TRADES BY DATE (for journal day view)
export async function getTrades() {
  const userId = await getUserId();
  if (!userId) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (error) {
    console.error(error.message);
    return [];
  }

  return data ?? [];
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export type PnlStats = {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
  allTime: number;

  max_profit: number;
  max_loss: number;
  win_rate: number;
  total_trades: number;

  avg_win: number;
  avg_loss: number;
  expectancy: number;
  max_drawdown: number;
  max_win_streak: number;
  max_loss_streak: number;

  earliest_trade: string | null;
  latest_trade: string | null;
};

export type ChartPoint = {
  date: string;
  cumulative_pnl: number;
  daily_pnl: number;
};

// ─────────────────────────────────────────────
// CREATE TRADE
// ─────────────────────────────────────────────
export async function createTrade(data: any) {
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated");

  const supabase = await createClient();

  const { data: trade, error } = await supabase
    .from("trades")
    .insert({ ...data, user_id: userId })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  return trade;
}

// ─────────────────────────────────────────────
// UPDATE TRADE
// ─────────────────────────────────────────────
export async function updateTrade(id: string, data: any) {
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated");

  const supabase = await createClient();

  const { error } = await supabase
    .from("trades")
    .update({ ...data })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
}

// ─────────────────────────────────────────────
// DELETE TRADE
// ─────────────────────────────────────────────
export async function deleteTrade(id: string) {
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated");

  const supabase = await createClient();

  const { error } = await supabase
    .from("trades")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
}

// ─────────────────────────────────────────────
// UPLOAD ATTACHMENTS
// ─────────────────────────────────────────────
export async function uploadTradeAttachments(
  tradeId: string,
  formData: FormData
) {
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated");

  const supabase = await createClient();
  const files = formData.getAll("files") as File[];

  for (const file of files) {
    if (!file || file.size === 0) continue;

    const path = `${userId}/${tradeId}/${Date.now()}_${file.name}`;

    const { error } = await supabase.storage
      .from("trade-attachments")
      .upload(path, file);

    if (error) console.error(error.message);
  }

  revalidatePath(`/trades/${tradeId}`);
}

// ─────────────────────────────────────────────
// GET PNL STATS (FIXED)
// ─────────────────────────────────────────────
export async function getPnlStats(): Promise<PnlStats> {
  const empty: PnlStats = {
    daily: 0, weekly: 0, monthly: 0, yearly: 0, allTime: 0,
    max_profit: 0, max_loss: 0, win_rate: 0, total_trades: 0,
    avg_win: 0, avg_loss: 0, expectancy: 0,
    max_drawdown: 0, max_win_streak: 0, max_loss_streak: 0,
    earliest_trade: null, latest_trade: null,
  };

  const userId = await getUserId();
  if (!userId) return empty;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("trades")
    .select("date, profit_loss, status")
    .eq("user_id", userId)
    .order("date", { ascending: true });

  if (error || !data || data.length === 0) return empty;

  const latestDate = parseISO(data[data.length - 1].date);
  const earliestDate = parseISO(data[0].date);

  // ✅ FIX: use real current date (timezone-safe)
  const today = new Date().toLocaleDateString("en-CA");

  const sum = (arr: typeof data) =>
    arr.reduce((s, t) => s + Number(t.profit_loss), 0);

  const now = new Date();

  const daily = sum(data.filter(t => t.date === today));

  const weekly = sum(data.filter(t => {
    const d = new Date(t.date);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    return d >= weekStart;
  }));

  const monthly = sum(data.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() &&
           d.getFullYear() === now.getFullYear();
  }));

  const yearly = sum(data.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === now.getFullYear();
  }));

  const allTime = sum(data);

  const pnls = data.map(t => Number(t.profit_loss));
  const max_profit = Math.max(...pnls);
  const max_loss = Math.min(...pnls);

  const wins = data.filter(t => t.status === "WIN");
  const total_trades = data.length;

  const win_rate =
    total_trades > 0 ? (wins.length / total_trades) * 100 : 0;

  const winsArr = data.filter(t => Number(t.profit_loss) > 0);
  const lossesArr = data.filter(t => Number(t.profit_loss) < 0);

  const avg_win = winsArr.length
    ? winsArr.reduce((s, t) => s + Number(t.profit_loss), 0) / winsArr.length
    : 0;

  const avg_loss = lossesArr.length
    ? lossesArr.reduce((s, t) => s + Number(t.profit_loss), 0) / lossesArr.length
    : 0;

  const win_rate_dec = total_trades ? winsArr.length / total_trades : 0;
  const loss_rate = 1 - win_rate_dec;

  const expectancy =
    win_rate_dec * avg_win - loss_rate * Math.abs(avg_loss);

  let peak = 0;
  let running = 0;
  let max_drawdown = 0;

  for (const t of data) {
    running += Number(t.profit_loss);
    if (running > peak) peak = running;
    const dd = peak - running;
    if (dd > max_drawdown) max_drawdown = dd;
  }

  let max_win_streak = 0;
  let max_loss_streak = 0;
  let cur_win = 0;
  let cur_loss = 0;

  for (const t of data) {
    if (t.status === "WIN") {
      cur_win++;
      cur_loss = 0;
    } else if (t.status === "LOSS") {
      cur_loss++;
      cur_win = 0;
    }

    if (cur_win > max_win_streak) max_win_streak = cur_win;
    if (cur_loss > max_loss_streak) max_loss_streak = cur_loss;
  }

  return {
    daily, weekly, monthly, yearly, allTime,
    max_profit, max_loss,
    win_rate,
    total_trades,
    avg_win,
    avg_loss,
    expectancy,
    max_drawdown,
    max_win_streak,
    max_loss_streak,
    earliest_trade: format(earliestDate, "yyyy-MM-dd"),
    latest_trade: format(latestDate, "yyyy-MM-dd"),
  };
}

// ─────────────────────────────────────────────
// RECENT TRADES
// ─────────────────────────────────────────────
export async function getRecentTrades(limit = 10) {
  const userId = await getUserId();
  if (!userId) return [];

  const supabase = await createClient();

  const { data } = await supabase
    .from("trades")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(limit);

  return data ?? [];
}

// ─────────────────────────────────────────────
// EQUITY CURVE
// ─────────────────────────────────────────────
export async function getPnlChartData(): Promise<ChartPoint[]> {
  const userId = await getUserId();
  if (!userId) return [];

  const supabase = await createClient();

  const { data } = await supabase
    .from("trades")
    .select("date, profit_loss")
    .eq("user_id", userId)
    .order("date", { ascending: true });

  if (!data || data.length === 0) return [];

  const byDate = new Map<string, number>();

  for (const t of data) {
    byDate.set(
      t.date,
      (byDate.get(t.date) ?? 0) + Number(t.profit_loss)
    );
  }

  let running = 0;

  return Array.from(byDate.entries()).map(([date, daily_pnl]) => {
    running += daily_pnl;
    return {
      date,
      daily_pnl,
      cumulative_pnl: running,
    };
  });
}
// ─────────────────────────────────────────────
// DAY STATS (for Journal Calendar)
// ─────────────────────────────────────────────
export async function getDayStats(year: number, month: number) {
  const userId = await getUserId();
  if (!userId) return [];

  console.log("DAY STATS QUERY:", year, month);

  const supabase = await createClient();

  const monthStr = String(month).padStart(2, "0");

  const start = `${year}-${monthStr}-01`;

  const endDate = new Date(year, month, 0);
  const end = format(endDate, "yyyy-MM-dd");

  const { data, error } = await supabase
    .from("trades")
    .select("date, profit_loss, status") // ✅ FIXED
    .eq("user_id", userId)
    .gte("date", start)
    .lte("date", end);

  if (error) {
    console.error("getDayStats error:", error.message);
    return [];
  }

  const map = new Map<string, {
    total_pnl: number;
    trade_count: number;
    wins: number;
    losses: number;
  }>();

  for (const t of data ?? []) {
    const day = t.date;

    if (!map.has(day)) {
      map.set(day, {
        total_pnl: 0,
        trade_count: 0,
        wins: 0,
        losses: 0,
      });
    }

    const stat = map.get(day)!;

    stat.total_pnl += Number(t.profit_loss ?? 0);
    stat.trade_count += 1;

    if (t.status === "WIN") stat.wins += 1;
    if (t.status === "LOSS") stat.losses += 1;
  }

  return Array.from(map.entries()).map(([date, stats]) => ({
    date,
    ...stats,
  }));
}


export async function getAllTrades() {
  const userId = await getUserId();
  if (!userId) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (error) {
    console.error("getAllTrades error:", error.message);
    return [];
  }

  return data ?? [];
}

  

// ─────────────────────────────────────────────
// Get trades by specific date
export async function getTradesByDate(date: string) {
  const userId = await getUserId();
  if (!userId) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getTradesByDate error:", error.message);
    return [];
  }

  return data ?? [];
}