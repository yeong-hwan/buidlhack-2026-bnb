import { Block } from '../base';

// shape=boolean: condition slot에만 결합 가능. 키워드 포함 여부(참/거짓) 반환
export class KeywordMatch extends Block {
  readonly type = 'keyword_match';
  readonly category = 'input' as const;
  readonly shape = 'boolean' as const;
  readonly outputType = 'boolean' as const;

  keyword: string = '';
  source: 'news' | 'social' | 'all' = 'all';
}
