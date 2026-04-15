import { Block } from '../base';

export class SetStopLoss extends Block {
  readonly type = 'set_stop_loss';
  readonly category = 'guard' as const;
  readonly shape = 'stack' as const;

  pct: number = 10;
}
