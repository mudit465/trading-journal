import { getDayStats } from "@/lib/actions/trades";
import { JournalCalendar } from "@/components/journal/calendar";

type JournalPageProps = {
  searchParams: Promise<{ month?: string; year?: string }>;
};

export default async function JournalPage({ searchParams }: JournalPageProps) {
  const params = await searchParams;
  const now = new Date();
  const year = parseInt(params.year ?? String(now.getFullYear()));
  const month = parseInt(params.month ?? String(now.getMonth() + 1));

  const dayStats = await getDayStats(year, month);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Journal</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Your trading calendar</p>
      </div>
      <JournalCalendar year={year} month={month} dayStats={dayStats} />
    </div>
  );
}
