import { Block, type BlockSpec } from '../base';
import type { CompareOperator } from '../types';

// boolean (hexagon): left [operator] right → boolean 출력
// left/right는 number value block 또는 number literal
export class Compare extends Block {
  readonly type = 'compare';
  readonly category = 'logic' as const;
  readonly shape = 'boolean' as const;

  operator: CompareOperator = '>';

  override getSpec(): BlockSpec {
    return {
      type: this.type,
      category: this.category,
      shape: this.shape,
      inputPorts: [
        { name: 'left', direction: 'in', kind: 'value', valueType: 'number', required: true },
        { name: 'operator', direction: 'in', kind: 'value', valueType: 'enum', required: true }, // > | >= | < | <= | == | !=
        { name: 'right', direction: 'in', kind: 'value', valueType: 'number', required: true },
      ],
      outputPorts: [
        { name: 'result', direction: 'out', kind: 'boolean', valueType: 'boolean', required: true },
      ],
    };
  }
}
