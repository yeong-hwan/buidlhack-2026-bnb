import { Block, type BlockSpec } from '../base';

// stack: 시장가 매수. broker/executor에 order command 생성
export class BuyMarket extends Block {
  readonly type = 'buy_market';
  readonly category = 'execution' as const;
  readonly shape = 'stack' as const;

  asset: string = '';
  amount: number = 0; // USDT 기준 금액

  override getSpec(): BlockSpec {
    return {
      type: this.type,
      category: this.category,
      shape: this.shape,
      inputPorts: [
        { name: 'prev', direction: 'in', kind: 'statement', required: false },
        { name: 'asset', direction: 'in', kind: 'value', valueType: 'asset', required: true },
        { name: 'amount', direction: 'in', kind: 'value', valueType: 'number', required: true },
      ],
      outputPorts: [
        { name: 'next', direction: 'out', kind: 'statement', required: false },
      ],
    };
  }
}
