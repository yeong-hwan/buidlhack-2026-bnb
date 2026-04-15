import { Block } from '../base';

export class PortfolioInfo extends Block {
  readonly type = 'portfolio_info';
  readonly category = 'input' as const;
  readonly shape = 'value' as const;
  readonly outputType = 'number' as const;

  field: 'total_value' | 'drawdown' | 'daily_pnl' | 'exposure' = 'total_value';
}
