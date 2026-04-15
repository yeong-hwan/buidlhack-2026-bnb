import { Block, type BlockSpec } from '../base';
import type { IntervalUnit } from '../types';

// stack: 손실 발생 후 duration 동안 신규 진입 금지. trade_history 읽음
export class CooldownAfterLoss extends Block {
  readonly type = 'cooldown_after_loss';
  readonly category = 'risk' as const;
  readonly shape = 'stack' as const;

  duration: number = 1;
  unit: IntervalUnit = 'h'; // 쿨다운 기간

  override getSpec(): BlockSpec {
    return {
      type: this.type,
      category: this.category,
      shape: this.shape,
      inputPorts: [
        { name: 'prev', direction: 'in', kind: 'statement', required: false },
        { name: 'duration', direction: 'in', kind: 'value', valueType: 'number', required: true },
        { name: 'unit', direction: 'in', kind: 'value', valueType: 'duration', required: true },
      ],
      outputPorts: [
        { name: 'next', direction: 'out', kind: 'statement', required: false },
      ],
    };
  }
}
