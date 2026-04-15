import { Block } from '../base';

export class ClosePosition extends Block {
  readonly type = 'close_position';
  readonly category = 'execution' as const;
  readonly shape = 'stack' as const;

  target: string | 'all' = 'all';
}
