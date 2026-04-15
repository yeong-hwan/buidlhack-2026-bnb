/**
 * Block Registry — 블록 타입 문자열 → 클래스 + 기본값 매핑.
 *
 * 두 가지 역할:
 *   1. BLOCK_REGISTRY — Block 클래스 인스턴스 생성 (getSpec() 호출용)
 *   2. createBlockNode() — 팔레트 드롭 시 BlockNode 생성
 *
 * createBlockNode 내부에서 기본값은 BLOCK_DEFAULTS에서 가져온다.
 * Block 클래스 인스턴스를 매번 생성하지 않아도 되므로 런타임 비용 최소화.
 */
import type { Block } from './base';
import type { BlockType, BlockTypeDataMap } from './data';
import type { BlockNode, TypedBlockNode } from './document';

// Start
import { EveryInterval } from './start/EveryInterval';
import { WhenSignalReceived } from './start/WhenSignalReceived';
import { WhenNewsArrives } from './start/WhenNewsArrives';
import { ManualRun } from './start/ManualRun';

// Input
import { PriceOf } from './input/PriceOf';
import { ChangePctOf } from './input/ChangePctOf';
import { VolumeOf } from './input/VolumeOf';
import { RsiOf } from './input/RsiOf';
import { MaOf } from './input/MaOf';
import { SentimentOf } from './input/SentimentOf';
import { PositionInfo } from './input/PositionInfo';
import { PortfolioInfo } from './input/PortfolioInfo';

// Logic
import { If } from './logic/If';
import { IfElse } from './logic/IfElse';
import { And } from './logic/And';
import { Or } from './logic/Or';
import { Not } from './logic/Not';
import { Compare } from './logic/Compare';
import { Between } from './logic/Between';
import { KeywordMatch } from './logic/KeywordMatch';

// Decision
import { EmitSignal } from './decision/EmitSignal';
import { ScoreSignal } from './decision/ScoreSignal';
import { ConfirmForNIntervals } from './decision/ConfirmForNIntervals';
import { Consensus } from './decision/Consensus';

// Execution
import { BuyMarket } from './execution/BuyMarket';
import { SellMarket } from './execution/SellMarket';
import { ClosePosition } from './execution/ClosePosition';
import { PauseStrategy } from './execution/PauseStrategy';
import { ResumeStrategy } from './execution/ResumeStrategy';

// Risk
import { SetStopLoss } from './guard/SetStopLoss';
import { SetTakeProfit } from './guard/SetTakeProfit';
import { MaxPositionSize } from './guard/MaxPositionSize';
import { CooldownAfterLoss } from './guard/CooldownAfterLoss';
import { KillSwitch } from './guard/KillSwitch';

// ── BLOCK_REGISTRY ────────────────────────────────────────────────────────────

/** Block 클래스 생성자 레지스트리. getSpec() 호출 등 스키마 조회에 사용 */
export const BLOCK_REGISTRY: Record<BlockType, new () => Block> = {
  // start
  every_interval: EveryInterval,
  when_signal_received: WhenSignalReceived,
  when_news_arrives: WhenNewsArrives,
  manual_run: ManualRun,
  // input
  price_of: PriceOf,
  change_pct_of: ChangePctOf,
  volume_of: VolumeOf,
  rsi_of: RsiOf,
  ma_of: MaOf,
  sentiment_of: SentimentOf,
  position_info: PositionInfo,
  portfolio_info: PortfolioInfo,
  // logic
  if: If,
  if_else: IfElse,
  and: And,
  or: Or,
  not: Not,
  compare: Compare,
  between: Between,
  keyword_match: KeywordMatch,
  // decision
  emit_signal: EmitSignal,
  score_signal: ScoreSignal,
  confirm_for_n_intervals: ConfirmForNIntervals,
  consensus: Consensus,
  // execution
  buy_market: BuyMarket,
  sell_market: SellMarket,
  close_position: ClosePosition,
  pause_strategy: PauseStrategy,
  resume_strategy: ResumeStrategy,
  // risk
  set_stop_loss: SetStopLoss,
  set_take_profit: SetTakeProfit,
  max_position_size: MaxPositionSize,
  cooldown_after_loss: CooldownAfterLoss,
  kill_switch: KillSwitch,
};

// ── BLOCK_DEFAULTS ────────────────────────────────────────────────────────────

/**
 * 각 블록의 기본 data 값.
 * Block 클래스 필드 기본값과 반드시 일치해야 한다.
 * createBlockNode()에서 사용.
 */
const BLOCK_DEFAULTS: { [K in BlockType]: () => BlockTypeDataMap[K] } = {
  // start
  every_interval:       () => ({ interval: 1, unit: 'h' }),
  when_signal_received: () => ({ signalType: 'ENTRY' }),
  when_news_arrives:    () => ({ source: 'all' }),
  manual_run:           () => ({}),
  // input
  price_of:      () => ({ asset: '' }),
  change_pct_of: () => ({ asset: '', windowSize: 1, windowUnit: 'h' }),
  volume_of:     () => ({ asset: '', windowSize: 24, windowUnit: 'h' }),
  rsi_of:        () => ({ asset: '', period: 14 }),
  ma_of:         () => ({ asset: '', period: 20 }),
  sentiment_of:  () => ({ target: '', source: 'all' }),
  position_info: () => ({ asset: '', field: 'size' }),
  portfolio_info:() => ({ field: 'total_value' }),
  // logic
  if:            () => ({}),
  if_else:       () => ({}),
  and:           () => ({ minOperands: 2 }),
  or:            () => ({ minOperands: 2 }),
  not:           () => ({}),
  compare:       () => ({ operator: '>' }),
  between:       () => ({}),
  keyword_match: () => ({ keyword: '', source: 'all' }),
  // decision
  emit_signal:             () => ({ signalType: 'ENTRY', strength: 100 }),
  score_signal:            () => ({ threshold: 70, weights: {} }),
  confirm_for_n_intervals: () => ({ n: 3 }),
  consensus:               () => ({ mode: 'majority' }),
  // execution
  buy_market:      () => ({ asset: '', amount: 0 }),
  sell_market:     () => ({ asset: '', amountPct: 100 }),
  close_position:  () => ({ target: 'all' }),
  pause_strategy:  () => ({}),
  resume_strategy: () => ({}),
  // risk
  set_stop_loss:        () => ({ pct: 10 }),
  set_take_profit:      () => ({ pct: 20 }),
  max_position_size:    () => ({ pct: 20 }),
  cooldown_after_loss:  () => ({ duration: 1, unit: 'h' }),
  kill_switch:          () => ({}),
};

// ── createBlockNode ───────────────────────────────────────────────────────────

/**
 * 팔레트 드롭 시 새 BlockNode를 생성한다.
 *
 * @param type - 블록 타입 문자열
 * @param x    - world 좌표 x
 * @param y    - world 좌표 y
 * @returns    새 BlockNode (id는 uuid 자동 생성)
 * @throws     존재하지 않는 type이면 에러 발생
 */
export function createBlockNode<T extends BlockType>(
  type: T,
  x: number,
  y: number,
): TypedBlockNode<T> {
  if (!(type in BLOCK_REGISTRY)) {
    throw new Error(`[createBlockNode] Unknown block type: "${type}"`);
  }

  const data = BLOCK_DEFAULTS[type]();
  const node: TypedBlockNode<T> = { id: crypto.randomUUID(), type, data: data as BlockTypeDataMap[T], x, y };

  // C-block 타입은 children 초기화
  const spec = new BLOCK_REGISTRY[type]().getSpec();
  if (spec.childSlots && spec.childSlots.length > 0) {
    const children: Record<string, string[]> = {};
    for (const slot of spec.childSlots) {
      children[slot.name] = [];
    }
    (node as BlockNode).children = children;
  }

  return node;
}

// ── getBlockSpec ──────────────────────────────────────────────────────────────

/**
 * 블록 타입의 BlockSpec을 반환한다.
 * validator, snap engine에서 port 정보 조회에 사용.
 */
export function getBlockSpec(type: BlockType) {
  if (!(type in BLOCK_REGISTRY)) {
    throw new Error(`[getBlockSpec] Unknown block type: "${type}"`);
  }
  return new BLOCK_REGISTRY[type]().getSpec();
}
