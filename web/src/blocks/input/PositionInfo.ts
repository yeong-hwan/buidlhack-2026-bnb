import { Block, type BlockSpec } from '../base';
import type { PositionField } from '../types';

export class PositionInfo extends Block {
  readonly type = 'position_info';
  readonly category = 'input' as const;
  readonly shape = 'value' as const;

  asset: string = '';
  field: PositionField = 'size'; // 기본: 포지션 보유량

  override getSpec(): BlockSpec {
    return {
      type: this.type,
      category: this.category,
      shape: this.shape,
      inputPorts: [
        { name: 'asset', direction: 'in', kind: 'value', valueType: 'asset', required: true },
        { name: 'field', direction: 'in', kind: 'value', valueType: 'enum', required: true }, // size | entry_price | pnl | holding_time
      ],
      outputPorts: [
        { name: 'value', direction: 'out', kind: 'value', valueType: 'number', required: true },
      ],
    };
  }
}
