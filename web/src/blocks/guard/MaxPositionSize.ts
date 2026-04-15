import { Block } from '../base';

export class MaxPositionSize extends Block {
  readonly type = 'max_position_size';
  readonly category = 'guard' as const;
  readonly shape = 'stack' as const;

  pct: number = 20;
}
