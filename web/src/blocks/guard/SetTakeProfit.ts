import { Block } from '../base';

export class SetTakeProfit extends Block {
  readonly type = 'set_take_profit';
  readonly category = 'guard' as const;
  readonly shape = 'stack' as const;

  pct: number = 20;
}
