function mapRowToTrade(row: any): any {
  const dateRaw = row.date?.trim();
  const instrumentRaw = row.symbol?.trim();
  const rawPnl = row.pnl?.trim();

  if (!dateRaw || !instrumentRaw || !rawPnl) return null;

  // Fix commas in numbers
  const cleanedPnl = rawPnl.replace(/,/g, "");
  const profit_loss = parseFloat(cleanedPnl);
  if (isNaN(profit_loss)) return null;

  // Normalize date
  const parsedDate = new Date(dateRaw);
  if (isNaN(parsedDate.getTime())) return null;
  const date = parsedDate.toISOString().split("T")[0];

  // Normalize instrument
  const instrument = instrumentRaw.toUpperCase();

  // Status
  const status =
    profit_loss > 0 ? "WIN" : profit_loss < 0 ? "LOSS" : "BREAKEVEN";

  // Direction
  const rawDir = row.direction?.toUpperCase().trim();
  const direction =
    rawDir === "SHORT" || rawDir === "SELL" ? "SHORT" : "LONG";

  return {
    date,
    instrument,
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
}