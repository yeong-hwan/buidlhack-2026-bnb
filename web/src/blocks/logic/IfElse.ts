import { Block, type BlockSpec } from '../base';

// control (c-block): condition slot 1개 + then/else child slot 2개
export class IfElse extends Block {
  readonly type = 'if_else';
  readonly category = 'logic' as const;
  readonly shape = 'c-block' as const;

  override getSpec(): BlockSpec {
    return {
      type: this.type,
      category: this.category,
      shape: this.shape,
      inputPorts: [
        { name: 'condition', direction: 'in', kind: 'boolean', valueType: 'boolean', required: true },
        { name: 'prev', direction: 'in', kind: 'statement', required: false },
      ],
      outputPorts: [
        { name: 'next', direction: 'out', kind: 'statement', required: false },
      ],
      childSlots: [
        { name: 'then', multiple: true }, // 조건 참일 때 실행
        { name: 'else', multiple: true }, // 조건 거짓일 때 실행
      ],
    };
  }
}
