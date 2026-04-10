import { syncBinanceTrades } from "@/lib/actions/binance";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Get logged-in user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // If not logged in → block
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use real user ID
    const data = await syncBinanceTrades(user.id);

    return Response.json(data);
  } catch (error) {
    console.error("Binance sync error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}