import { Block } from '../base';

export class PositionInfo extends Block {
  readonly type = 'position_info';
  readonly category = 'input' as const;
  readonly shape = 'value' as const;
  readonly outputType = 'number' as const;

  asset: string = '';
  field: 'size' | 'entry_price' | 'pnl' | 'holding_time' = 'pnl';
}
