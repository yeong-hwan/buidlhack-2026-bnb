import { Block, type BlockSpec } from '../base';

export class ManualRun extends Block {
  readonly type = 'manual_run';
  readonly category = 'start' as const;
  readonly shape = 'hat' as const;

  override getSpec(): BlockSpec {
    return {
      type: this.type,
      category: this.category,
      shape: this.shape,
      inputPorts: [],
      outputPorts: [
        { name: 'trigger', direction: 'out', kind: 'trigger', required: true },
        { name: 'next', direction: 'out', kind: 'statement', required: false },
      ],
    };
  }
}
