import { Block, type BlockSpec } from '../base';

// control (c-block): condition slot 1개 + then child slot
export class If extends Block {
  readonly type = 'if';
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
        { name: 'then', multiple: true }, // 조건 참일 때 실행되는 statement 목록
      ],
    };
  }
}
