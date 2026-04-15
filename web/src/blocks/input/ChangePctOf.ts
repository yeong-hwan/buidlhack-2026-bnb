import { Block } from '../base';

export class ChangePctOf extends Block {
  readonly type = 'change_pct_of';
  readonly category = 'input' as const;
  readonly shape = 'value' as const;
  readonly outputType = 'number' as const;

  asset: string = '';
  window: string = '1h';
}
