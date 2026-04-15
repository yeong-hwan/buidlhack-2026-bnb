/**
 * Runtime types — 컴파일 후 실행 계층에서 사용하는 타입.
 *
 * StrategyDocument → compile() → CompiledGraph → 런타임 실행
 *
 * ── kill_switch 범위 정의 ────────────────────────────────────
 *   kill_switch는 현재 trigger chain 실행을 즉시 종료하고
 *   strategyState.killed = true로 마킹.
 *   이후 모든 trigger 발화 시 실행 전 killed 여부를 확인해 무시.
 *   스코프: 해당 CompiledGraph (= 하나의 StrategyDocument) 전체.
 *
 * ── pause_strategy 저장 위치 ────────────────────────────────
 *   pause 상태는 RuntimeContext.strategyState.paused에 저장.
 *   trigger 발화 시 paused=true이면 executeStatement 진입 없이 무시.
 *   resume_strategy 실행 시 paused=false로 복원.
 */
import type { Signal } from './document';
import type { SignalType } from './types';

// ── Compiled Graph (컴파일/실행용) ───────────────────────────────────────────

export type LiteralValue = string | number | boolean;

export type CompiledNodeKind = 'trigger' | 'statement' | 'expression' | 'predicate';

export interface CompiledNode {
  id: string;
  type: string;
  /**
   * 노드의 역할 분류:
   *   trigger    — every_interval, when_signal_received, when_news_arrives, manual_run
   *   statement  — if, if_else, buy_market, emit_signal, ... (실행 흐름, 부수효과 있음)
   *   expression — price_of, rsi_of, ma_of, ... (값 계산, 부수효과 없음)
   *   predicate  — compare, between, and, or, not, keyword_match (boolean 계산)
   */
  kind: CompiledNodeKind;
  /**
   * 이 노드의 입력값.
   * block output → block input edge: CompiledNode 참조
   * inline literal (data 필드에서 온 값): LiteralValue
   *
   * literal 원칙: primitive 값은 edge 아님. block.data에서 직접 옴.
   */
  inputs: Record<string, CompiledNode | LiteralValue>;
  /**
   * C-block child 배열.
   * key: slot 이름 ('then', 'else', 'signals')
   * 배열 순서 = 실행 순서. child 내부에 statement edge 없음.
   */
  children: Record<string, CompiledNode[]>;
  /** statement 체인의 다음 노드 */
  next?: CompiledNode;
}

// ── Compiled Graph (컨테이너) ─────────────────────────────────────────────────

export interface CompiledGraph {
  /**
   * trigger 노드 목록 (hat 블록).
   * 하나의 strategy document에 hat 블록이 여러 개일 수 있음.
   * 각 trigger는 독립된 실행 체인의 root.
   */
  triggers: CompiledNode[];
  /**
   * 모든 CompiledNode를 id로 빠르게 조회.
   * 디버깅, 실행 추적, signal 구독 설정에 사용.
   */
  nodesById: Record<string, CompiledNode>;
}

// ── Runtime Context ───────────────────────────────────────────────────────────

export interface Position {
  asset: string;
  size: number;
  entryPrice: number;
  pnl: number;
  holdingTime: number; // milliseconds
}

export interface PortfolioState {
  totalValue: number;
  drawdown: number;    // % (0~100)
  dailyPnl: number;   // %
  exposure: number;    // % (포지션 비율)
}

export interface SignalBus {
  emit(signal: Signal): void;
  subscribe(type: SignalType, cb: (s: Signal) => void): () => void;
  latest(type: SignalType): Signal | null;
}

/**
 * strategy 실행 상태.
 * pause_strategy / resume_strategy / kill_switch가 이 값을 변경.
 * trigger 발화 시 최우선 체크 대상.
 */
export interface StrategyState {
  /**
   * pause_strategy 실행 시 true.
   * resume_strategy 실행 시 false.
   * paused=true → 모든 trigger 발화 무시.
   */
  paused: boolean;
  /**
   * kill_switch 실행 시 true. 복원 불가.
   * killed=true → 모든 trigger 발화 영구 무시.
   */
  killed: boolean;
}

export interface RuntimeContext {
  now: number;
  /** asset symbol → 현재 가격 */
  prices: Record<string, number>;
  /** asset symbol → 포지션 정보 */
  positions: Record<string, Position>;
  portfolio: PortfolioState;
  signals: SignalBus;
  /** pause/kill 상태. trigger 발화 전 체크 */
  strategyState: StrategyState;
}
