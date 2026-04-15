import { Block } from '../base';

export class PriceOf extends Block {
  readonly type = 'price_of';
  readonly category = 'input' as const;
  readonly shape = 'value' as const;
  readonly outputType = 'number' as const;

  asset: string = '';
}
