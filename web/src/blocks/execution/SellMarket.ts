import { Block, type BlockSpec } from '../base';

// stack: 시장가 매도. 보유 포지션의 amount_pct%를 매도
export class SellMarket extends Block {
  readonly type = 'sell_market';
  readonly category = 'execution' as const;
  readonly shape = 'stack' as const;

  asset: string = '';
  amountPct: number = 100; // 보유량 대비 매도 비율 (%)

  override getSpec(): BlockSpec {
    return {
      type: this.type,
      category: this.category,
      shape: this.shape,
      inputPorts: [
        { name: 'prev', direction: 'in', kind: 'statement', required: false },
        { name: 'asset', direction: 'in', kind: 'value', valueType: 'asset', required: true },
        { name: 'amountPct', direction: 'in', kind: 'value', valueType: 'number', required: true },
      ],
      outputPorts: [
        { name: 'next', direction: 'out', kind: 'statement', required: false },
      ],
    };
  }
}
