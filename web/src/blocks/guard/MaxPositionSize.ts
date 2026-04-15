import { Block, type BlockSpec } from '../base';

// stack: 포트폴리오 대비 단일 포지션 최대 비율 제한. 초과 주문은 cap됨
export class MaxPositionSize extends Block {
  readonly type = 'max_position_size';
  readonly category = 'risk' as const;
  readonly shape = 'stack' as const;

  pct: number = 20; // 포트폴리오 대비 최대 비율 (%)

  override getSpec(): BlockSpec {
    return {
      type: this.type,
      category: this.category,
      shape: this.shape,
      inputPorts: [
        { name: 'prev', direction: 'in', kind: 'statement', required: false },
        { name: 'pct', direction: 'in', kind: 'value', valueType: 'number', required: true },
      ],
      outputPorts: [
        { name: 'next', direction: 'out', kind: 'statement', required: false },
      ],
    };
  }
}
