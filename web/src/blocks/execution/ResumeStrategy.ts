import { Block, type BlockSpec } from '../base';

// stack: 일시정지된 전략을 재개
export class ResumeStrategy extends Block {
  readonly type = 'resume_strategy';
  readonly category = 'execution' as const;
  readonly shape = 'stack' as const;

  override getSpec(): BlockSpec {
    return {
      type: this.type,
      category: this.category,
      shape: this.shape,
      inputPorts: [
        { name: 'prev', direction: 'in', kind: 'statement', required: false },
      ],
      outputPorts: [
        { name: 'next', direction: 'out', kind: 'statement', required: false },
      ],
    };
  }
}
