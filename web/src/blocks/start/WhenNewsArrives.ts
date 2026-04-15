import { Block, type BlockSpec } from '../base';
import type { NewsSource } from '../types';

export class WhenNewsArrives extends Block {
  readonly type = 'when_news_arrives';
  readonly category = 'start' as const;
  readonly shape = 'hat' as const;

  source: NewsSource = 'all';

  override getSpec(): BlockSpec {
    return {
      type: this.type,
      category: this.category,
      shape: this.shape,
      inputPorts: [
        { name: 'source', direction: 'in', kind: 'value', valueType: 'source', required: true },
      ],
      outputPorts: [
        { name: 'trigger', direction: 'out', kind: 'trigger', required: true },
        { name: 'next', direction: 'out', kind: 'statement', required: false },
      ],
    };
  }
}
