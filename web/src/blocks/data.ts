/**
 * Block data types — 각 블록의 설정값 구조.
 * BlockNode.data의 타입으로 사용된다.
 *
 * 규칙:
 * - data는 블록 인스턴스의 "설정값(configuration)"만 담는다
 * - edge로 연결된 값(left, right, condition 등)은 data에 없다
 * - 기본값은 각 Block 클래스의 필드 기본값과 일치해야 한다
 */
import type {
  IntervalUnit,
  SignalType,
  NewsSource,
  SentimentSource,
  CompareOperator,
  ConsensusMode,
  PositionField,
  PortfolioField,
} from './types';

// ── Start ────────────────────────────────────────────────────────────────────

export interface EveryIntervalData {
  interval: number;
  unit: IntervalUnit;
}

export interface WhenSignalReceivedData {
  signalType: SignalType;
}

export interface WhenNewsArrivesData {
  source: NewsSource;
}

export type ManualRunData = Record<string, never>;

// ── Input ────────────────────────────────────────────────────────────────────

export interface PriceOfData {
  asset: string;
}

export interface ChangePctOfData {
  asset: string;
  windowSize: number;
  windowUnit: IntervalUnit;
}

export interface VolumeOfData {
  asset: string;
  windowSize: number;
  windowUnit: IntervalUnit;
}

export interface RsiOfData {
  asset: string;
  period: number;
}

export interface MaOfData {
  asset: string;
  period: number;
}

export interface SentimentOfData {
  target: string;
  source: SentimentSource;
}

export interface PositionInfoData {
  asset: string;
  field: PositionField;
}

export interface PortfolioInfoData {
  field: PortfolioField;
}

// ── Logic ────────────────────────────────────────────────────────────────────

export type IfData = Record<string, never>;

export type IfElseData = Record<string, never>;

export interface AndData {
  minOperands: number;
}

export interface OrData {
  minOperands: number;
}

export type NotData = Record<string, never>;

export interface CompareData {
  operator: CompareOperator;
}

export type BetweenData = Record<string, never>;

export interface KeywordMatchData {
  keyword: string;
  source: NewsSource;
}

// ── Decision ─────────────────────────────────────────────────────────────────

export interface EmitSignalData {
  signalType: SignalType;
  strength: number;
}

export interface ScoreSignalData {
  threshold: number;
  weights: Record<string, number>;
}

export interface ConfirmForNIntervalsData {
  n: number;
}

export interface ConsensusData {
  mode: ConsensusMode;
}

// ── Execution ─────────────────────────────────────────────────────────────────

export interface BuyMarketData {
  asset: string;
  amount: number;
}

export interface SellMarketData {
  asset: string;
  amountPct: number;
}

export interface ClosePositionData {
  target: string;
}

export type PauseStrategyData = Record<string, never>;

export type ResumeStrategyData = Record<string, never>;

// ── Risk ─────────────────────────────────────────────────────────────────────

export interface SetStopLossData {
  pct: number;
}

export interface SetTakeProfitData {
  pct: number;
}

export interface MaxPositionSizeData {
  pct: number;
}

export interface CooldownAfterLossData {
  duration: number;
  unit: IntervalUnit;
}

export type KillSwitchData = Record<string, never>;

// ── Union ─────────────────────────────────────────────────────────────────────

export type BlockData =
  // start
  | EveryIntervalData
  | WhenSignalReceivedData
  | WhenNewsArrivesData
  | ManualRunData
  // input
  | PriceOfData
  | ChangePctOfData
  | VolumeOfData
  | RsiOfData
  | MaOfData
  | SentimentOfData
  | PositionInfoData
  | PortfolioInfoData
  // logic
  | IfData
  | IfElseData
  | AndData
  | OrData
  | NotData
  | CompareData
  | BetweenData
  | KeywordMatchData
  // decision
  | EmitSignalData
  | ScoreSignalData
  | ConfirmForNIntervalsData
  | ConsensusData
  // execution
  | BuyMarketData
  | SellMarketData
  | ClosePositionData
  | PauseStrategyData
  | ResumeStrategyData
  // risk
  | SetStopLossData
  | SetTakeProfitData
  | MaxPositionSizeData
  | CooldownAfterLossData
  | KillSwitchData;

/**
 * 블록 type 문자열 → data 타입 매핑 (타입 가드용)
 */
export type BlockTypeDataMap = {
  every_interval: EveryIntervalData;
  when_signal_received: WhenSignalReceivedData;
  when_news_arrives: WhenNewsArrivesData;
  manual_run: ManualRunData;
  price_of: PriceOfData;
  change_pct_of: ChangePctOfData;
  volume_of: VolumeOfData;
  rsi_of: RsiOfData;
  ma_of: MaOfData;
  sentiment_of: SentimentOfData;
  position_info: PositionInfoData;
  portfolio_info: PortfolioInfoData;
  if: IfData;
  if_else: IfElseData;
  and: AndData;
  or: OrData;
  not: NotData;
  compare: CompareData;
  between: BetweenData;
  keyword_match: KeywordMatchData;
  emit_signal: EmitSignalData;
  score_signal: ScoreSignalData;
  confirm_for_n_intervals: ConfirmForNIntervalsData;
  consensus: ConsensusData;
  buy_market: BuyMarketData;
  sell_market: SellMarketData;
  close_position: ClosePositionData;
  pause_strategy: PauseStrategyData;
  resume_strategy: ResumeStrategyData;
  set_stop_loss: SetStopLossData;
  set_take_profit: SetTakeProfitData;
  max_position_size: MaxPositionSizeData;
  cooldown_after_loss: CooldownAfterLossData;
  kill_switch: KillSwitchData;
};

export type BlockType = keyof BlockTypeDataMap;
