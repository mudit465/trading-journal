import { getConcepts } from "@/lib/actions/concepts";
import { TradeForm } from "@/components/trades/trade-form";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type NewTradePageProps = {
  searchParams: Promise<{ date?: string }>;
};

export default async function NewTradePage({ searchParams }: NewTradePageProps) {
  const params = await searchParams;
  const concepts = await getConcepts();

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
      <Link
        href="/journal"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Log a trade</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Record every detail to grow your edge</p>
      </div>

      <TradeForm concepts={concepts} defaultDate={params.date} />
    </div>
  );
}
