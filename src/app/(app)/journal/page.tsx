// src/app/(app)/journal/page.tsx

import { JournalCalendar } from "@/components/journal/calendar";
import { getDayStats } from "@/lib/actions/trades";

type JournalPageProps = {
  // In Next.js 15+ searchParams is a Promise
  searchParams: Promise<{ month?: string; year?: string }>;
};

export default async function JournalPage({ searchParams }: JournalPageProps) {
  const now = new Date();

  // ✅ Must await searchParams in Next.js 15+
  const { year: yearParam, month: monthParam } = await searchParams;

  const year  = parseInt(yearParam  ?? String(now.getFullYear()));
  const month = parseInt(monthParam ?? String(now.getMonth() + 1));

  const dayStats = await getDayStats(year, month);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Journal</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Your trading calendar
        </p>
      </div>

      <JournalCalendar
        year={year}
        month={month}
        dayStats={dayStats}
      />
    </div>
  );
}
