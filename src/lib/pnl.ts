// src/lib/pnl.ts

export type PnlInput = {
  direction: "LONG" | "SHORT";
  entryPrice: number;
  exitPrice: number;
  positionSize: number;   // units / lots / quantity
};

export type PnlResult = {
  profit_loss: number;    // raw dollar amount
  rr_ratio: number;       // reward-to-risk (needs sl_pips)
  status: "WIN" | "LOSS" | "BREAKEVEN";
};

export function calculatePnl({
  direction,
  entryPrice,
  exitPrice,
  positionSize,
}: PnlInput): Omit<PnlResult, "rr_ratio"> {
  if (
    !entryPrice || !exitPrice || !positionSize ||
    isNaN(entryPrice) || isNaN(exitPrice) || isNaN(positionSize)
  ) {
    return { profit_loss: 0, status: "BREAKEVEN" };
  }

  const priceDiff =
    direction === "LONG"
      ? exitPrice - entryPrice      //  up = profit for LONG
      : entryPrice - exitPrice;     //  down = profit for SHORT

  const profit_loss = parseFloat((priceDiff * positionSize).toFixed(2));

  const status =
    profit_loss > 0 ? "WIN" :
    profit_loss < 0 ? "LOSS" :
    "BREAKEVEN";

  return { profit_loss, status };
}

export function calculateRR(
  profit_loss: number,
  risk_amount: number
): number {
  if (!risk_amount || risk_amount === 0) return 0;
  return parseFloat((profit_loss / risk_amount).toFixed(2));
}