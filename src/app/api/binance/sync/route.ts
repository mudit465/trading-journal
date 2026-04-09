import { syncBinanceTrades } from "@/lib/actions/binance";

export async function GET() {
  // TEMP: bypass auth
  const userId = "test-user-id";

  const data = await syncBinanceTrades(userId);

  return Response.json(data);
}