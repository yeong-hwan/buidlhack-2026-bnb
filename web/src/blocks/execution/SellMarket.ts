import { Block } from '../base';

export class SellMarket extends Block {
  readonly type = 'sell_market';
  readonly category = 'execution' as const;
  readonly shape = 'stack' as const;

  asset: string = '';
  amount_pct: number = 100;
}
