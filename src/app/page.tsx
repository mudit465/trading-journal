import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TrendingUp, BarChart3, Calendar, StickyNote, Bot, Shield } from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Track your PnL",
    desc: "Daily, weekly, monthly, and yearly profit & loss at a glance.",
  },
  {
    icon: Calendar,
    title: "Calendar view",
    desc: "Visual heat map of your trading activity and performance.",
  },
  {
    icon: TrendingUp,
    title: "Detailed trade log",
    desc: "Log every detail — RR, SL/TP pips, sessions, concepts, and more.",
  },
  {
    icon: StickyNote,
    title: "Sticky notes",
    desc: "Keep quick reminders and insights pinned to your board.",
  },
  {
    icon: Bot,
    title: "AI analysis",
    desc: "Ask AI to review your trades and spot patterns in your mistakes.",
  },
  {
    icon: Shield,
    title: "Private & secure",
    desc: "Your data is encrypted and only visible to you.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Nav */}
      <nav className="border-b border-zinc-900 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-indigo-400" />
          <span className="font-semibold text-zinc-100 tracking-tight">TradeLog</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/auth/login">Sign in</Link>
          </Button>
          <Button variant="primary" size="sm" asChild>
            <Link href="/auth/register">Get started</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center max-w-3xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-4 py-1.5 text-xs text-indigo-400 mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Minimal. Focused. Yours.
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-zinc-100 tracking-tight mb-6 leading-[1.1]">
          Your trading journal,{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
            done right
          </span>
        </h1>

        <p className="text-zinc-500 text-lg leading-relaxed mb-10 max-w-xl">
          Log trades, track PnL across timeframes, review with AI, and build the discipline 
          to become a consistently profitable trader.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="primary" size="lg" asChild>
            <Link href="/auth/register">Start journaling — it&apos;s free</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/auth/login">Sign in</Link>
          </Button>
        </div>
      </main>

      {/* Features */}
      <section className="border-t border-zinc-900 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-medium text-zinc-600 uppercase tracking-widest mb-12">
            Everything you need
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-zinc-900 bg-zinc-900/50 p-5 group hover:border-zinc-800 transition-colors"
              >
                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-3 group-hover:bg-indigo-500/15 transition-colors">
                  <f.icon className="h-4 w-4 text-indigo-400" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-200 mb-1.5">{f.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 px-6 text-center text-xs text-zinc-700">
        © {new Date().getFullYear()} TradeLog. Built for traders.
      </footer>
    </div>
  );
}
