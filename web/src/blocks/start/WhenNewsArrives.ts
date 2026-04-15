import { Block } from '../base';

export class WhenNewsArrives extends Block {
  readonly type = 'when_news_arrives';
  readonly category = 'start' as const;
  readonly shape = 'hat' as const;

  source: 'news' | 'social' | 'all' = 'all';
}
