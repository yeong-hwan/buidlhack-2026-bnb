import { Block, type BlockSpec } from '../base';

// boolean (hexagon): boolean 입력을 반전 → boolean 출력
export class Not extends Block {
  readonly type = 'not';
  readonly category = 'logic' as const;
  readonly shape = 'boolean' as const;

  override getSpec(): BlockSpec {
    return {
      type: this.type,
      category: this.category,
      shape: this.shape,
      inputPorts: [
        { name: 'condition', direction: 'in', kind: 'boolean', valueType: 'boolean', required: true },
      ],
      outputPorts: [
        { name: 'result', direction: 'out', kind: 'boolean', valueType: 'boolean', required: true },
      ],
    };
  }
}
