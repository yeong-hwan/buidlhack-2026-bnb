import { Block, type BlockSpec } from '../base';

// boolean (hexagon): min <= value <= max → boolean 출력
export class Between extends Block {
  readonly type = 'between';
  readonly category = 'logic' as const;
  readonly shape = 'boolean' as const;

  override getSpec(): BlockSpec {
    return {
      type: this.type,
      category: this.category,
      shape: this.shape,
      inputPorts: [
        { name: 'value', direction: 'in', kind: 'value', valueType: 'number', required: true },
        { name: 'min', direction: 'in', kind: 'value', valueType: 'number', required: true },
        { name: 'max', direction: 'in', kind: 'value', valueType: 'number', required: true },
      ],
      outputPorts: [
        { name: 'result', direction: 'out', kind: 'boolean', valueType: 'boolean', required: true },
      ],
    };
  }
}
