import { getAllTrades } from "@/lib/actions/trades";
import { AllTradesClient } from "@/components/all-trades/all-trades-client";

export const dynamic = "force-dynamic";

export default async function AllTradesPage() {
  const trades = await getAllTrades();

  return <AllTradesClient trades={trades} />;
}