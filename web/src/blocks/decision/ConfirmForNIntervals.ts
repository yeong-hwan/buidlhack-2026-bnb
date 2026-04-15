import { Block, type BlockSpec } from '../base';

// stack: 직전 n개 구간에서 조건이 연속으로 참인지 확인 → 노이즈 제거용
export class ConfirmForNIntervals extends Block {
  readonly type = 'confirm_for_n_intervals';
  readonly category = 'decision' as const;
  readonly shape = 'stack' as const;

  n: number = 3; // 연속 확인 구간 수

  override getSpec(): BlockSpec {
    return {
      type: this.type,
      category: this.category,
      shape: this.shape,
      inputPorts: [
        { name: 'prev', direction: 'in', kind: 'statement', required: false },
        { name: 'condition', direction: 'in', kind: 'boolean', valueType: 'boolean', required: true },
        { name: 'n', direction: 'in', kind: 'value', valueType: 'number', required: true },
      ],
      outputPorts: [
        { name: 'next', direction: 'out', kind: 'statement', required: false },
        { name: 'confirmed', direction: 'out', kind: 'boolean', valueType: 'boolean', required: true },
      ],
    };
  }
}
