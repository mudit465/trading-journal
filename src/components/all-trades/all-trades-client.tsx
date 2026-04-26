"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import {
  Search,
  ArrowUpRight,
  ArrowDownRight,
  SlidersHorizontal,
  X,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  TrendingUp,
  Activity,
  CalendarDays,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency, getPnlColor } from "@/lib/utils";
import type { Trade } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type SortKey = "date" | "profit_loss" | "rr_ratio" | "checklist_score";
type SortDir = "asc" | "desc";

type Filters = {
  search: string;
  status: string;
  instrument: string;
  concept: string;
  session: string;
  dateFrom: string;
  dateTo: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function statusBadgeVariant(status: string): "win" | "loss" | "breakeven" | "default" {
  if (status === "WIN") return "win";
  if (status === "LOSS") return "loss";
  if (status === "BREAKEVEN") return "breakeven";
  return "default";
}

function SortIcon({ col, sort }: { col: SortKey; sort: { key: SortKey; dir: SortDir } }) {
  if (sort.key !== col) return <ChevronsUpDown className="h-3 w-3 text-zinc-600" />;
  return sort.dir === "asc"
    ? <ChevronUp className="h-3 w-3 text-indigo-400" />
    : <ChevronDown className="h-3 w-3 text-indigo-400" />;
}

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

type Props = { trades: Trade[] };

export function AllTradesClient({ trades }: Props) {
  const router = useRouter();

  const [filters, setFilters] = useState<Filters>({
    search: "", status: "", instrument: "", concept: "",
    session: "", dateFrom: "", dateTo: "",
  });

  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: "date", dir: "desc",
  });

  const [filtersOpen, setFiltersOpen] = useState(false);

  // ── Derived option lists ──────────────────────────────────────────────────
  const instruments = useMemo(
    () => [...new Set(trades.map((t) => t.instrument))].sort(), [trades]
  );
  const concepts = useMemo(
    () => [...new Set(trades.flatMap((t) => t.concepts ?? []))].sort(), [trades]
  );
  const sessions = useMemo(
    () => [...new Set(trades.map((t) => t.session).filter(Boolean))].sort() as string[],
    [trades]
  );

  // ── Filter + sort ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = trades.filter((t) => {
      const q = filters.search.toLowerCase();
      if (
        q &&
        !t.instrument.toLowerCase().includes(q) &&
        !(t.notes ?? "").toLowerCase().includes(q) &&
        !(t.concepts ?? []).some((c) => c.toLowerCase().includes(q))
      ) return false;

      if (filters.status && t.status !== filters.status) return false;
      if (filters.instrument && t.instrument !== filters.instrument) return false;
      if (filters.concept && !(t.concepts ?? []).includes(filters.concept)) return false;
      if (filters.session && t.session !== filters.session) return false;
      if (filters.dateFrom && new Date(t.date) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(t.date) > new Date(filters.dateTo)) return false;
      return true;
    });

    return [...result].sort((a, b) => {
      let av: number, bv: number;
      switch (sort.key) {
        case "date":
          av = new Date(a.date).getTime(); bv = new Date(b.date).getTime(); break;
        case "profit_loss":
          av = Number(a.profit_loss); bv = Number(b.profit_loss); break;
        case "rr_ratio":
          av = Number(a.rr_ratio); bv = Number(b.rr_ratio); break;
        case "checklist_score":
          av = a.checklist_score ?? 0; bv = b.checklist_score ?? 0; break;
      }
      return sort.dir === "asc" ? av - bv : bv - av;
    });
  }, [trades, filters, sort]);

  // ── Live summary ──────────────────────────────────────────────────────────
  const summary = useMemo(() => {
    const total = filtered.length;
    const wins = filtered.filter((t) => t.status === "WIN").length;
    const winRate = total ? Math.round((wins / total) * 100) : 0;
    const netPnl = filtered.reduce((s, t) => s + Number(t.profit_loss), 0);
    return { total, winRate, netPnl };
  }, [filtered]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "desc" }
    );
  }

  const hasActiveFilters = !!(
    filters.status || filters.instrument || filters.concept ||
    filters.session || filters.dateFrom || filters.dateTo
  );

  function clearFilters() {
    setFilters({ search: "", status: "", instrument: "", concept: "", session: "", dateFrom: "", dateTo: "" });
  }

  const handleRowClick = useCallback(
    (id: string) => { router.push(`/trades/${id}?ref=all-trades`); },
    [router]
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">All Trades</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Your complete trading history</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
            <Activity className="h-4 w-4 text-zinc-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500">Total trades</p>
            <p className="text-xl font-bold text-zinc-100">{summary.total}</p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500">Win rate</p>
            <p className="text-xl font-bold text-zinc-100">{summary.winRate}%</p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 flex items-center gap-3">
          <div className={cn(
            "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
            summary.netPnl >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"
          )}>
            {summary.netPnl >= 0
              ? <ArrowUpRight className="h-4 w-4 text-emerald-400" />
              : <ArrowDownRight className="h-4 w-4 text-red-400" />
            }
          </div>
          <div>
            <p className="text-xs text-zinc-500">Net PnL</p>
            <p className={cn("text-xl font-bold", getPnlColor(summary.netPnl))}>
              {summary.netPnl >= 0 ? "+" : ""}{formatCurrency(summary.netPnl)}
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search instrument, concept, notes…"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2
                       text-sm text-zinc-200 placeholder:text-zinc-600 outline-none
                       focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 transition-colors"
          />
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm border transition-colors",
            filtersOpen || hasActiveFilters
              ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {hasActiveFilters && <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />}
        </button>

        {/* Sort shortcuts */}
        <div className="flex items-center gap-1">
          {([
            { key: "date" as SortKey, label: "Newest" },
            { key: "profit_loss" as SortKey, label: "Best PnL" },
            { key: "rr_ratio" as SortKey, label: "Best RR" },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => toggleSort(key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs border transition-colors",
                sort.key === key
                  ? "bg-zinc-800 border-zinc-700 text-zinc-100"
                  : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      {/* Filter panel */}
      {filtersOpen && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Result", key: "status" as keyof Filters, options: [
              { value: "WIN", label: "Win" },
              { value: "LOSS", label: "Loss" },
              { value: "BREAKEVEN", label: "Breakeven" },
            ]},
            { label: "Instrument", key: "instrument" as keyof Filters, options: instruments.map(i => ({ value: i, label: i })) },
            { label: "Concept", key: "concept" as keyof Filters, options: concepts.map(c => ({ value: c, label: c })) },
            { label: "Session", key: "session" as keyof Filters, options: sessions.map(s => ({ value: s, label: s })) },
          ].map(({ label, key, options }) => (
            <div key={key}>
              <label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5 block font-medium">{label}</label>
              <select
                value={filters[key]}
                onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5
                           text-xs text-zinc-300 outline-none focus:border-indigo-500/40 cursor-pointer"
              >
                <option value="">All</option>
                {options.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          ))}

          <div>
            <label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5 block font-medium">From</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5
                         text-xs text-zinc-300 outline-none focus:border-indigo-500/40 [color-scheme:dark]"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5 block font-medium">To</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5
                         text-xs text-zinc-300 outline-none focus:border-indigo-500/40 [color-scheme:dark]"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <CalendarDays className="h-8 w-8 text-zinc-700 mx-auto" />
            <p className="text-zinc-500 text-sm">
              {hasActiveFilters ? "No trades match your filters." : "No trades logged yet."}
            </p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/80">
                  <th className="text-left px-4 py-3 w-[110px]">
                    <button onClick={() => toggleSort("date")} className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors">
                      Date <SortIcon col="date" sort={sort} />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Instrument</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Dir</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Result</th>
                  <th className="text-right px-4 py-3 w-[100px]">
                    <button onClick={() => toggleSort("profit_loss")} className="flex items-center gap-1 ml-auto text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors">
                      PnL <SortIcon col="profit_loss" sort={sort} />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3 w-[70px]">
                    <button onClick={() => toggleSort("rr_ratio")} className="flex items-center gap-1 ml-auto text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors">
                      RR <SortIcon col="rr_ratio" sort={sort} />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 hidden lg:table-cell">Session</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 hidden xl:table-cell">Concepts</th>
                  <th className="text-right px-4 py-3 w-[70px]">
                    <button onClick={() => toggleSort("checklist_score")} className="flex items-center gap-1 ml-auto text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors">
                      Score <SortIcon col="checklist_score" sort={sort} />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 hidden xl:table-cell">Notes</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-800/50">
                {filtered.map((trade) => (
                  <tr
                    key={trade.id}
                    onClick={() => handleRowClick(trade.id)}
                    className="hover:bg-zinc-800/40 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">
                      {format(parseISO(trade.date), "MMM d, yyyy")}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-zinc-200 group-hover:text-zinc-100 transition-colors">
                        {trade.instrument}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={trade.direction === "LONG" ? "win" : "loss"} className="text-[10px] py-0">
                        {trade.direction}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusBadgeVariant(trade.status)} className="text-[10px] py-0">
                        {trade.status}
                      </Badge>
                    </td>
                    <td className={cn("px-4 py-3 text-right font-semibold tabular-nums text-xs", getPnlColor(trade.profit_loss))}>
                      {trade.profit_loss >= 0 ? "+" : ""}{formatCurrency(trade.profit_loss)}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-400 text-xs tabular-nums">
                      {trade.rr_ratio}R
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs hidden lg:table-cell">
                      {trade.session ?? "—"}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(trade.concepts ?? []).slice(0, 2).map((c) => (
                          <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 whitespace-nowrap">
                            {c}
                          </span>
                        ))}
                        {(trade.concepts ?? []).length > 2 && (
                          <span className="text-[10px] text-zinc-600">+{(trade.concepts ?? []).length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {trade.checklist_score != null ? (
                        <span className={cn("text-xs font-medium tabular-nums", scoreColor(trade.checklist_score))}>
                          {trade.checklist_score}%
                        </span>
                      ) : (
                        <span className="text-zinc-700 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell max-w-[180px]">
                      <span className="block truncate text-xs text-zinc-600">
                        {trade.notes
                          ? (trade.notes.length > 60 ? trade.notes.slice(0, 60) + "…" : trade.notes)
                          : "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Results count */}
      <p className="text-xs text-zinc-600 pb-2">
        Showing{" "}
        <span className="text-zinc-400 font-medium">{filtered.length}</span>{" "}
        of{" "}
        <span className="text-zinc-400 font-medium">{trades.length}</span>{" "}
        trades
      </p>
    </div>
  );
}