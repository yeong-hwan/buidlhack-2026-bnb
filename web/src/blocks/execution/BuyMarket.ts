import { Block } from '../base';

export class BuyMarket extends Block {
  readonly type = 'buy_market';
  readonly category = 'execution' as const;
  readonly shape = 'stack' as const;

  asset: string = '';
  amount: number = 0;
}
