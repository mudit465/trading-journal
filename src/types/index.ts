// src/types/index.ts

export type Session = {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  expires: string;
};

export type TradeDirection = "LONG" | "SHORT";

export type TradeSession =
  | "LONDON"
  | "NEW_YORK"
  | "ASIAN"
  | "SYDNEY"
  | "OVERLAP"
  | "OTHER";

export type TradeStatus = "WIN" | "LOSS" | "BREAKEVEN";

// ─────────────────────────────────────────────
// Concepts
// ─────────────────────────────────────────────
export type Concept = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
};

// ─────────────────────────────────────────────
// Take Profit Levels
// ─────────────────────────────────────────────
export type TakeProfitLevel = {
  id?: string;
  trade_id?: string;
  level: number;
  pips: number;
  price?: number | null;
  hit: boolean;
};

// ─────────────────────────────────────────────
// Attachments
// ─────────────────────────────────────────────
export type TradeAttachment = {
  id: string;
  trade_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  created_at: string;
};

// ─────────────────────────────────────────────
// Trade (DB Model)
// ─────────────────────────────────────────────
export type Trade = {
  id: string;
  user_id: string;
  date: string;
  instrument: string;
  direction: TradeDirection;

  session?: TradeSession | null;
  entry_time?: string | null;
  exit_time?: string | null;

  risk_amount: number;
  rr_ratio: number;
  sl_pips: number;
  tp_pips: number;
  profit_loss: number;

  status: TradeStatus;
  mistakes?: string | null;
good_things?: string | null;
  notes?: string | null;
  concepts?: string[];
  tp_levels?: TakeProfitLevel[];
  attachments?: TradeAttachment[];

  // Existing checklist (flexible)
  checklist?: Record<string, boolean>;

  // ✅ NEW: review system
  checklist_score?: number;

  mistakes_tags?: string[];
  mistakes_notes?: string;

  well_tags?: string[];
  well_notes?: string;

  review_notes?: string;
  review_tags?: string[];

  created_at: string;
  updated_at: string;
};

// ─────────────────────────────────────────────
// Trade Form Data (Frontend)
// ─────────────────────────────────────────────
export type TradeFormData = {
  date: string;
  instrument: string;
  direction: TradeDirection;

  session?: TradeSession | null;
  entry_time?: string;
  exit_time?: string;

  risk_amount: number;
  rr_ratio: number;
  sl_pips: number;
  tp_pips: number;
  profit_loss: number;

  status: TradeStatus;

  notes?: string;
  concepts?: string[];

  tp_levels?: Omit<TakeProfitLevel, "id" | "trade_id">[];

  // Existing checklist
  checklist?: Record<string, boolean>;

  // ✅ NEW: review system
  checklist_score?: number;

  mistakes_tags?: string[];
  mistakes_notes?: string;

  well_tags?: string[];
  well_notes?: string;

  review_notes?: string;
  review_tags?: string[];
};

// ─────────────────────────────────────────────
// Sticky Notes
// ─────────────────────────────────────────────
export type StickyNote = {
  id: string;
  user_id: string;
  content: string;
  color: string;
  position_x: number;
  position_y: number;
  created_at: string;
  updated_at: string;
};

// ─────────────────────────────────────────────
// Stats
// ─────────────────────────────────────────────
export type DayStats = {
  date: string;
  total_pnl: number;
  trade_count: number;
  wins: number;
  losses: number;
};

export type PnlStats = {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
  max_profit: number;
  max_loss: number;
  win_rate: number;
  total_trades: number;
};