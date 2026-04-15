import { Block, type BlockSpec } from '../base';
import type { NewsSource } from '../types';

// boolean (hexagon): 키워드 포함 여부(참/거짓) 반환 → condition slot에만 결합
export class KeywordMatch extends Block {
  readonly type = 'keyword_match';
  readonly category = 'logic' as const;
  readonly shape = 'boolean' as const;

  keyword: string = '';
  source: NewsSource = 'all';

  override getSpec(): BlockSpec {
    return {
      type: this.type,
      category: this.category,
      shape: this.shape,
      inputPorts: [
        { name: 'keyword', direction: 'in', kind: 'value', valueType: 'string', required: true },
        { name: 'source', direction: 'in', kind: 'value', valueType: 'source', required: true },
      ],
      outputPorts: [
        { name: 'result', direction: 'out', kind: 'boolean', valueType: 'boolean', required: true },
      ],
    };
  }
}
