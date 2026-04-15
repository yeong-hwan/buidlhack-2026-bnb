import { Block } from '../base';

export class SentimentOf extends Block {
  readonly type = 'sentiment_of';
  readonly category = 'input' as const;
  readonly shape = 'value' as const;
  readonly outputType = 'number' as const;

  target: string = '';
  source: 'news' | 'social' | 'all' = 'all';
}
