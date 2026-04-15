import { Block, type BlockSpec } from '../base';

// stack: 진입가 기준 pct% 상승 시 자동 매도. 다음 진입 시점에 적용
export class SetTakeProfit extends Block {
  readonly type = 'set_take_profit';
  readonly category = 'risk' as const;
  readonly shape = 'stack' as const;

  pct: number = 20; // 익절 기준 비율 (%)

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
