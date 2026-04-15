import { Block } from '../base';

// shape=aggregator: 다수 신호 입력 → 단일 판단 출력. node port 방식으로 연결
export class Consensus extends Block {
  readonly type = 'consensus';
  readonly category = 'decision' as const;
  readonly shape = 'aggregator' as const;

  mode: 'any' | 'all' | 'majority' | 'weighted' = 'majority';
}
