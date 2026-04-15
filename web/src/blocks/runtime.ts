/**
 * Runtime types — 컴파일 후 실행 계층에서 사용하는 타입.
 *
 * document.ts의 StrategyDocument를 컴파일하면 CompiledNode 트리가 만들어진다.
 * RuntimeContext는 매 trigger 발화 시 생성된다.
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
   *   trigger    — EveryInterval, WhenSignalReceived, WhenNewsArrives, ManualRun
   *   statement  — If, IfElse, BuyMarket, EmitSignal, ... (실행 흐름)
   *   expression — PriceOf, RsiOf, MaOf, ... (값 계산, 부수효과 없음)
   *   predicate  — Compare, Between, And, Or, Not, KeywordMatch (boolean 계산)
   */
  kind: CompiledNodeKind;
  /**
   * 이 노드의 입력값.
   * edge로 연결된 값은 CompiledNode 참조, 인라인 리터럴은 LiteralValue.
   */
  inputs: Record<string, CompiledNode | LiteralValue>;
  /**
   * C-block의 child 배열.
   * key: slot 이름 ('then', 'else', 'signals')
   */
  children: Record<string, CompiledNode[]>;
  /** statement 체인의 다음 노드 */
  next?: CompiledNode;
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

export interface RuntimeContext {
  now: number;
  /** asset symbol → 현재 가격 */
  prices: Record<string, number>;
  /** asset symbol → 포지션 정보 */
  positions: Record<string, Position>;
  portfolio: PortfolioState;
  signals: SignalBus;
}

// ── Compiled Graph (컨테이너) ─────────────────────────────────────────────────

export interface CompiledGraph {
  /** trigger 노드 (hat 블록) */
  root: CompiledNode;
}
