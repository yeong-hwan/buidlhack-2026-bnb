/**
 * 블록의 시각적 형태 (문법 계층)
 *
 * hat        — 전략 시작점. 스택 최상단만 허용
 * stack      — 실행/설정 action. 위아래 연결 가능
 * control    — C-block. 내부에 child stack 보유 (if, if_else)
 * boolean    — 육각형. condition slot에만 결합 가능
 * value      — pill 캡슐. typed slot에만 결합 가능
 * aggregator — 집계 노드. 다수 신호 입력 → 단일 판단 출력 (consensus)
 */
export type BlockShape = 'hat' | 'stack' | 'control' | 'boolean' | 'value' | 'aggregator';

/**
 * 슬롯 타입 — value block의 출력 타입, slot의 허용 타입 결정
 *
 * number  — 가격, RSI, MA 등 수치
 * asset   — BNB, BTC, ETH 등 자산 심볼
 * signal  — ENTRY, EXIT, BULLISH, BEARISH 등 신호
 * text    — 키워드, 소스명 등 문자열
 * boolean — 참/거짓 조건식
 */
export type SlotType = 'number' | 'asset' | 'signal' | 'text' | 'boolean';

export type BlockCategory = 'start' | 'input' | 'logic' | 'decision' | 'execution' | 'guard';

export abstract class Block {
  abstract readonly type: string;
  abstract readonly category: BlockCategory;
  abstract readonly shape: BlockShape;
}
