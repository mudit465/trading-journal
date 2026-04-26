"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { auth } from "@/lib/auth";
import type { MappedTrade } from "@/components/csv-import";

export async function importTradesFromCSV(
  trades: MappedTrade[]
): Promise<{ success?: string; error?: string }> {

  console.log("🔥 NEW IMPORT FUNCTION RUNNING");

  // ✅ ONLY use NextAuth
  const session = await auth();
  console.log("🔐 NextAuth session:", session);

  if (!session?.user?.id) {
    return { error: "Login required" };
  }

  const supabase = await createClient();

  // ✅ use session user id
  const rows = trades.map((t) => ({
    ...t,
    user_id: session?.user?.id ?? "",
  }));

  console.log("📦 Rows to insert:", rows);

  const { data, error: insertError } = await supabase
    .from("trades")
    .insert(rows)
    .select();

  console.log("📥 Inserted data:", data);
  console.log("💥 Insert error:", insertError);

  if (insertError) {
    return { error: "Failed to save trades: " + insertError.message };
  }

  revalidatePath("/dashboard");

  return {
    success: `${rows.length} trades imported successfully`,
  };
}