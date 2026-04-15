import { Block } from '../base';

export class RsiOf extends Block {
  readonly type = 'rsi_of';
  readonly category = 'input' as const;
  readonly shape = 'value' as const;
  readonly outputType = 'number' as const;

  asset: string = '';
  period: number = 14;
}
