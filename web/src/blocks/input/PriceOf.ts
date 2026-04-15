import { Block, type BlockSpec } from '../base';

export class PriceOf extends Block {
  readonly type = 'price_of';
  readonly category = 'input' as const;
  readonly shape = 'value' as const;

  asset: string = '';

  override getSpec(): BlockSpec {
    return {
      type: this.type,
      category: this.category,
      shape: this.shape,
      inputPorts: [
        { name: 'asset', direction: 'in', kind: 'value', valueType: 'asset', required: true },
      ],
      outputPorts: [
        { name: 'value', direction: 'out', kind: 'value', valueType: 'number', required: true },
      ],
    };
  }
}
