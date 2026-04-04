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
export type TradeSession = "LONDON" | "NEW_YORK" | "ASIAN" | "SYDNEY" | "OVERLAP" | "OTHER";
export type TradeStatus = "WIN" | "LOSS" | "BREAKEVEN";

export type Concept = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
};

export type TakeProfitLevel = {
  id?: string;
  trade_id?: string;
  level: number;
  pips: number;
  price?: number | null;
  hit: boolean;
};

export type TradeAttachment = {
  id: string;
  trade_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  created_at: string;
};

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
  notes?: string | null;
  concepts?: string[];
  tp_levels?: TakeProfitLevel[];
  attachments?: TradeAttachment[];
  checklist?: Record<string, boolean>;
  created_at: string;
  updated_at: string;
};

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
  checklist?: Record<string, boolean>;
};

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
