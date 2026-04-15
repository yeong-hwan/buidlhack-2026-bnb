import { Block, type BlockSpec } from '../base';

export class RsiOf extends Block {
  readonly type = 'rsi_of';
  readonly category = 'input' as const;
  readonly shape = 'value' as const;

  asset: string = '';
  period: number = 14;

  override getSpec(): BlockSpec {
    return {
      type: this.type,
      category: this.category,
      shape: this.shape,
      inputPorts: [
        { name: 'asset', direction: 'in', kind: 'value', valueType: 'asset', required: true },
        { name: 'period', direction: 'in', kind: 'value', valueType: 'number', required: true },
      ],
      outputPorts: [
        { name: 'value', direction: 'out', kind: 'value', valueType: 'number', required: true },
      ],
    };
  }
}
