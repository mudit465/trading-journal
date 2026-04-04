import { getTradeById } from "@/lib/actions/trades";
import { getConcepts } from "@/lib/actions/concepts";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { TradeForm } from "@/components/trades/trade-form";

type EditTradePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditTradePage({ params }: EditTradePageProps) {
  const { id } = await params;
  const [trade, concepts] = await Promise.all([getTradeById(id), getConcepts()]);

  if (!trade) notFound();

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
      <Link
        href={`/trades/${id}`}
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Edit trade</h1>
        <p className="text-sm text-zinc-500 mt-0.5">{trade.instrument}</p>
      </div>

      <TradeForm concepts={concepts} trade={trade} />
    </div>
  );
}
