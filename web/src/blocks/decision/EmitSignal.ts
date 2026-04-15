import { Block, type BlockSpec } from '../base';
import type { SignalType } from '../types';

// stack: 판단 결과를 외부 전략/에이전트에 신호로 전달. 전략 간 연결의 표준 출력
export class EmitSignal extends Block {
  readonly type = 'emit_signal';
  readonly category = 'decision' as const;
  readonly shape = 'stack' as const;

  signalType: SignalType = 'ENTRY';
  strength: number = 100; // 0~100, 신호 강도

  override getSpec(): BlockSpec {
    return {
      type: this.type,
      category: this.category,
      shape: this.shape,
      inputPorts: [
        { name: 'prev', direction: 'in', kind: 'statement', required: false },
        { name: 'signalType', direction: 'in', kind: 'value', valueType: 'signal', required: true },
        { name: 'strength', direction: 'in', kind: 'value', valueType: 'number', required: true },
      ],
      outputPorts: [
        { name: 'signal', direction: 'out', kind: 'signal', valueType: 'signal', required: true }, // 외부 신호 출력
        { name: 'next', direction: 'out', kind: 'statement', required: false },
      ],
    };
  }
}
