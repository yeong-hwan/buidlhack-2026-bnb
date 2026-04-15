import { Block, type BlockSpec } from '../base';
import type { SentimentSource } from '../types';

export class SentimentOf extends Block {
  readonly type = 'sentiment_of';
  readonly category = 'input' as const;
  readonly shape = 'value' as const;

  target: string = ''; // 자산명 또는 키워드 (예: "BTC", "crypto market")
  source: SentimentSource = 'all';

  override getSpec(): BlockSpec {
    return {
      type: this.type,
      category: this.category,
      shape: this.shape,
      inputPorts: [
        { name: 'target', direction: 'in', kind: 'value', valueType: 'string', required: true }, // 자산명이 아닌 검색어 기준
        { name: 'source', direction: 'in', kind: 'value', valueType: 'source', required: true },
      ],
      outputPorts: [
        { name: 'value', direction: 'out', kind: 'value', valueType: 'number', required: true }, // -1.0 ~ 1.0 감성 점수
      ],
    };
  }
}
