export type IntervalUnit = 'm' | 'h' | 'd' | 'w';
export type SignalType =
  | 'ENTRY'
  | 'EXIT'
  | 'BUY'
  | 'SELL'
  | 'HOLD'
  | 'BULLISH'
  | 'BEARISH'
  | 'RISK_ON'
  | 'RISK_OFF'
  | 'NEUTRAL';

export type NewsSource = 'news' | 'social' | 'all';
export type SentimentSource = 'news' | 'social' | 'all';
export type CompareOperator = '>' | '>=' | '<' | '<=' | '==' | '!=';
export type ConsensusMode = 'any' | 'all' | 'majority' | 'weighted';
export type PositionField = 'size' | 'entry_price' | 'pnl' | 'holding_time';
export type PortfolioField =
  | 'total_value'
  | 'drawdown'
  | 'daily_pnl'
  | 'exposure';

export interface WeightedSignalInput {
  signal: SignalType;
  weight: number;
}

export interface ConditionRef {
  blockId: string;
}

export interface ValueRef {
  blockId: string;
}

export interface StatementRef {
  blockId: string;
}
