import { Block, type BlockSpec } from '../base';
import type { IntervalUnit } from '../types';

export class VolumeOf extends Block {
  readonly type = 'volume_of';
  readonly category = 'input' as const;
  readonly shape = 'value' as const;

  asset: string = '';
  windowSize: number = 24; // 기본 24시간 거래량
  windowUnit: IntervalUnit = 'h';

  override getSpec(): BlockSpec {
    return {
      type: this.type,
      category: this.category,
      shape: this.shape,
      inputPorts: [
        { name: 'asset', direction: 'in', kind: 'value', valueType: 'asset', required: true },
        { name: 'windowSize', direction: 'in', kind: 'value', valueType: 'number', required: true },
        { name: 'windowUnit', direction: 'in', kind: 'value', valueType: 'duration', required: true },
      ],
      outputPorts: [
        { name: 'value', direction: 'out', kind: 'value', valueType: 'number', required: true },
      ],
    };
  }
}
