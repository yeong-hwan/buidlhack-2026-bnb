import { Block, type BlockSpec } from '../base';
import type { PortfolioField } from '../types';

export class PortfolioInfo extends Block {
  readonly type = 'portfolio_info';
  readonly category = 'input' as const;
  readonly shape = 'value' as const;

  field: PortfolioField = 'total_value';

  override getSpec(): BlockSpec {
    return {
      type: this.type,
      category: this.category,
      shape: this.shape,
      inputPorts: [
        { name: 'field', direction: 'in', kind: 'value', valueType: 'enum', required: true },
      ],
      outputPorts: [
        { name: 'value', direction: 'out', kind: 'value', valueType: 'number', required: true },
      ],
    };
  }
}
