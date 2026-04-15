import { describe, it, expect } from 'vitest';
import { BLOCK_REGISTRY, createBlockNode, getBlockSpec } from '../registry';
import type { BlockType } from '../data';

const ALL_TYPES: BlockType[] = [
  // start
  'every_interval', 'when_signal_received', 'when_news_arrives', 'manual_run',
  // input
  'price_of', 'change_pct_of', 'volume_of', 'rsi_of', 'ma_of',
  'sentiment_of', 'position_info', 'portfolio_info',
  // logic
  'if', 'if_else', 'and', 'or', 'not', 'compare', 'between', 'keyword_match',
  // decision
  'emit_signal', 'score_signal', 'confirm_for_n_intervals', 'consensus',
  // execution
  'buy_market', 'sell_market', 'close_position', 'pause_strategy', 'resume_strategy',
  // risk
  'set_stop_loss', 'set_take_profit', 'max_position_size', 'cooldown_after_loss', 'kill_switch',
];

describe('BLOCK_REGISTRY', () => {
  it('34개 블록이 모두 등록되어 있다', () => {
    expect(Object.keys(BLOCK_REGISTRY)).toHaveLength(34);
  });

  it('모든 타입이 등록되어 있다', () => {
    for (const type of ALL_TYPES) {
      expect(BLOCK_REGISTRY[type]).toBeDefined();
    }
  });
});

describe('createBlockNode', () => {
  it('every_interval 기본값 확인', () => {
    const node = createBlockNode('every_interval', 0, 0);
    expect(node.type).toBe('every_interval');
    expect(node.data.interval).toBe(1);
    expect(node.data.unit).toBe('h');
    expect(node.x).toBe(0);
    expect(node.y).toBe(0);
    expect(typeof node.id).toBe('string');
    expect(node.id.length).toBeGreaterThan(0);
  });

  it('buy_market 기본값 확인', () => {
    const node = createBlockNode('buy_market', 100, 200);
    expect(node.type).toBe('buy_market');
    expect(node.data.asset).toBe('');
    expect(node.data.amount).toBe(0);
    expect(node.x).toBe(100);
    expect(node.y).toBe(200);
  });

  it('compare 기본값 확인', () => {
    const node = createBlockNode('compare', 0, 0);
    expect(node.data.operator).toBe('>');
  });

  it('emit_signal 기본값 확인', () => {
    const node = createBlockNode('emit_signal', 0, 0);
    expect(node.data.signalType).toBe('ENTRY');
    expect(node.data.strength).toBe(100);
  });

  it('and 기본값 확인', () => {
    const node = createBlockNode('and', 0, 0);
    expect(node.data.minOperands).toBe(2);
  });

  it('volume_of 기본값 확인', () => {
    const node = createBlockNode('volume_of', 0, 0);
    expect(node.data.windowSize).toBe(24);
    expect(node.data.windowUnit).toBe('h');
  });

  it('id가 호출마다 달라야 한다 (uuid)', () => {
    const a = createBlockNode('buy_market', 0, 0);
    const b = createBlockNode('buy_market', 0, 0);
    expect(a.id).not.toBe(b.id);
  });

  it('C-block(if)은 children 초기화 포함', () => {
    const node = createBlockNode('if', 0, 0);
    expect(node.children).toBeDefined();
    expect(node.children!.then).toEqual([]);
  });

  it('if_else는 then/else 슬롯 초기화', () => {
    const node = createBlockNode('if_else', 0, 0);
    expect(node.children!.then).toEqual([]);
    expect(node.children!.else).toEqual([]);
  });

  it('consensus는 signals 슬롯 초기화', () => {
    const node = createBlockNode('consensus', 0, 0);
    expect(node.children!.signals).toEqual([]);
  });

  it('hat 블록(every_interval)은 children 없음', () => {
    const node = createBlockNode('every_interval', 0, 0);
    expect(node.children).toBeUndefined();
  });

  it('존재하지 않는 type → 에러', () => {
    expect(() => createBlockNode('nonexistent' as BlockType, 0, 0)).toThrow();
  });
});

describe('getBlockSpec', () => {
  it('모든 블록의 getSpec() 호출 성공', () => {
    for (const type of ALL_TYPES) {
      const spec = getBlockSpec(type);
      expect(spec.type).toBe(type);
      expect(Array.isArray(spec.inputPorts)).toBe(true);
      expect(Array.isArray(spec.outputPorts)).toBe(true);
    }
  });

  it('hat 블록은 trigger out 포트를 가진다', () => {
    const hatTypes: BlockType[] = ['every_interval', 'when_signal_received', 'when_news_arrives', 'manual_run'];
    for (const type of hatTypes) {
      const spec = getBlockSpec(type);
      const triggerPort = spec.outputPorts.find(p => p.kind === 'trigger');
      expect(triggerPort).toBeDefined();
    }
  });

  it('C-block은 childSlots를 가진다', () => {
    const cblockTypes: BlockType[] = ['if', 'if_else', 'consensus'];
    for (const type of cblockTypes) {
      const spec = getBlockSpec(type);
      expect(spec.childSlots).toBeDefined();
      expect(spec.childSlots!.length).toBeGreaterThan(0);
    }
  });

  it('if는 then 슬롯을 가진다', () => {
    const spec = getBlockSpec('if');
    expect(spec.childSlots!.find(s => s.name === 'then')).toBeDefined();
  });

  it('if_else는 then/else 슬롯을 가진다', () => {
    const spec = getBlockSpec('if_else');
    const names = spec.childSlots!.map(s => s.name);
    expect(names).toContain('then');
    expect(names).toContain('else');
  });

  it('compare는 boolean out 포트를 가진다', () => {
    const spec = getBlockSpec('compare');
    const out = spec.outputPorts.find(p => p.kind === 'boolean');
    expect(out).toBeDefined();
    expect(out?.name).toBe('result');
  });

  it('존재하지 않는 type → 에러', () => {
    expect(() => getBlockSpec('nonexistent' as BlockType)).toThrow();
  });
});
