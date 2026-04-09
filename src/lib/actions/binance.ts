"use server";

import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";

const BASE_URL = "https://fapi.binance.com";

export async function syncBinanceTrades(userId: string) {
  const supabase = await createClient();

  // get api keys from DB
  const { data: account } = await supabase
    .from("binance_accounts")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!account) throw new Error("Binance not connected");

  const apiKey = account.api_key;
  const secret = account.api_secret;

  const timestamp = Date.now();
  const query = `timestamp=${timestamp}`;

  const signature = crypto
    .createHmac("sha256", secret)
    .update(query)
    .digest("hex");

  const res = await fetch(
    `${BASE_URL}/fapi/v2/account?${query}&signature=${signature}`,
    {
      headers: {
        "X-MBX-APIKEY": apiKey,
      },
    }
  );

  const data = await res.json();

  return data;
}