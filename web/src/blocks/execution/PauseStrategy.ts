import { Block, type BlockSpec } from '../base';

// stack: 현재 전략을 일시정지. resume_strategy 전까지 trigger 무시
export class PauseStrategy extends Block {
  readonly type = 'pause_strategy';
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
