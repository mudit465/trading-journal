"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { importTradesFromCSV } from "@/app/actions/import-trades";

/* ───────────────── TYPES ───────────────── */

type RawCSVRow = {
  date?: string;
  Date?: string;
  symbol?: string;
  Symbol?: string;
  pnl?: string;
  PnL?: string;
  entry_time?: string;
  exit_time?: string;
  direction?: string;
  [key: string]: string | undefined;
};

export type MappedTrade = {
  date: string;
  instrument: string;
  profit_loss: number;
  entry_time: string | null;
  exit_time: string | null;
  direction: "LONG" | "SHORT";
  status: "WIN" | "LOSS" | "BREAKEVEN";
  risk_amount: number;
  rr_ratio: number;
  sl_pips: number;
  tp_pips: number;
};

/* ───────────────── MAPPER ───────────────── */

function mapRowToTrade(row: any): any {
  console.log("📥 Raw row:", row);

  const date = row.date || row.Date;
  const instrument = row.symbol || row.Symbol;
  const rawPnl = row.pnl || row.PnL;

  if (!date || !instrument || rawPnl === undefined || rawPnl === "") {
    console.log("❌ Skipping invalid row");
    return null;
  }

  const profit_loss = parseFloat(rawPnl);
  if (isNaN(profit_loss)) {
    console.log("❌ Invalid PnL:", rawPnl);
    return null;
  }

  const status: "WIN" | "LOSS" | "BREAKEVEN" =
    profit_loss > 0 ? "WIN" : profit_loss < 0 ? "LOSS" : "BREAKEVEN";

  const rawDir = row.direction?.toUpperCase().trim();
  const direction: "LONG" | "SHORT" =
    rawDir === "SHORT" ? "SHORT" : "LONG";

  const mapped = {
    date: date.trim(),
    instrument: instrument.trim(),
    profit_loss,
    status,
    direction,
    entry_time: row.entry_time?.trim() || null,
    exit_time: row.exit_time?.trim() || null,
    risk_amount: 0,
    rr_ratio: 0,
    sl_pips: 0,
    tp_pips: 0,
  };

  console.log("✅ Mapped:", mapped);

  return mapped;
}

/* ───────────────── COMPONENT ───────────────── */

export function CSVImport() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: string;
    error?: string;
  } | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";
    setLoading(true);
    setResult(null);

    Papa.parse<RawCSVRow>(file, {
      header: true,
      skipEmptyLines: true,

      complete: async (parsed) => {
        console.log("📄 Parsed data:", parsed.data);
        console.log("❌ Parse errors:", parsed.errors);

        if (parsed.errors.length > 0) {
          setResult({
            error: "CSV parse error: " + parsed.errors[0].message,
          });
          setLoading(false);
          return;
        }

        const trades = parsed.data
          .map((row) => mapRowToTrade(row))
          .filter((t): t is MappedTrade => t !== null);

        console.log("📊 Final trades:", trades);

        if (trades.length === 0) {
          setResult({
            error:
              "No valid trades found. Check CSV headers: date, symbol, pnl",
          });
          setLoading(false);
          return;
        }

        try {
          const res = await importTradesFromCSV(trades);
        console.log("📬 Server response:", JSON.stringify(res, null, 2));
          setResult(res);
        } catch (err) {
          console.error("🚨 Upload failed:", err);
          setResult({ error: "Failed to upload trades." });
        }

        setLoading(false);
      },

      error: (err) => {
        console.error("🚨 File read error:", err);
        setResult({ error: "Failed to read file: " + err.message });
        setLoading(false);
      },
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Button */}
      <Button
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
        className="w-fit gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Importing…
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Import CSV
          </>
        )}
      </Button>

      {/* Result */}
      {result?.success && (
        <p className="text-xs text-emerald-400">{result.success}</p>
      )}
      {result?.error && (
        <p className="text-xs text-red-400">{result.error}</p>
      )}
    </div>
  );
}