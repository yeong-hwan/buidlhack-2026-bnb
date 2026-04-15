import { Block, type BlockSpec } from '../base';
import type { IntervalUnit } from '../types';

export class EveryInterval extends Block {
  readonly type = 'every_interval';
  readonly category = 'start' as const;
  readonly shape = 'hat' as const;

  interval: number = 1;
  unit: IntervalUnit = 'h';

  override getSpec(): BlockSpec {
    return {
      type: this.type,
      category: this.category,
      shape: this.shape,
      inputPorts: [
        { name: 'interval', direction: 'in', kind: 'value', valueType: 'number', required: true },
        { name: 'unit', direction: 'in', kind: 'value', valueType: 'duration', required: true },
      ],
      outputPorts: [
        { name: 'trigger', direction: 'out', kind: 'trigger', required: true },
        { name: 'next', direction: 'out', kind: 'statement', required: false },
      ],
    };
  }
}
