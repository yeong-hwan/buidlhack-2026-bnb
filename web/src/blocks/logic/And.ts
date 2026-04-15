import { Block, type BlockSpec } from '../base';

// boolean (hexagon): 여러 boolean 입력을 AND 결합 → boolean 출력
export class And extends Block {
  readonly type = 'and';
  readonly category = 'logic' as const;
  readonly shape = 'boolean' as const;

  minOperands: number = 2; // 최소 2개 조건 필요

  override getSpec(): BlockSpec {
    return {
      type: this.type,
      category: this.category,
      shape: this.shape,
      inputPorts: [
        { name: 'conditions', direction: 'in', kind: 'boolean', valueType: 'boolean', required: true, multiple: true },
      ],
      outputPorts: [
        { name: 'result', direction: 'out', kind: 'boolean', valueType: 'boolean', required: true },
      ],
    };
  }
}
