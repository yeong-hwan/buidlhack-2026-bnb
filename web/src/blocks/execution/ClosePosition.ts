import { Block, type BlockSpec } from '../base';

// stack: 포지션 전체 종료. target='all'이면 전체 포지션 정리
export class ClosePosition extends Block {
  readonly type = 'close_position';
  readonly category = 'execution' as const;
  readonly shape = 'stack' as const;

  target: string = 'all'; // 특정 asset 심볼 또는 'all'

  override getSpec(): BlockSpec {
    return {
      type: this.type,
      category: this.category,
      shape: this.shape,
      inputPorts: [
        { name: 'prev', direction: 'in', kind: 'statement', required: false },
        { name: 'target', direction: 'in', kind: 'value', valueType: 'asset', required: true },
      ],
      outputPorts: [
        { name: 'next', direction: 'out', kind: 'statement', required: false },
      ],
    };
  }
}
