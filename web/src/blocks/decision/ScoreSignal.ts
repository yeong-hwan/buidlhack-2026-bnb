import { Block, type BlockSpec } from '../base';

// stack: 여러 조건에 가중치를 부여해 점수 합산 → threshold 초과 시 신호 발생
export class ScoreSignal extends Block {
  readonly type = 'score_signal';
  readonly category = 'decision' as const;
  readonly shape = 'stack' as const;

  threshold: number = 70; // 0~100, 이 점수 이상이면 신호 발생
  weights: Record<string, number> = {}; // { conditionId: weight }

  override getSpec(): BlockSpec {
    return {
      type: this.type,
      category: this.category,
      shape: this.shape,
      inputPorts: [
        { name: 'prev', direction: 'in', kind: 'statement', required: false },
        { name: 'threshold', direction: 'in', kind: 'value', valueType: 'number', required: true },
        { name: 'weights', direction: 'in', kind: 'value', valueType: 'object', required: true },
      ],
      outputPorts: [
        { name: 'next', direction: 'out', kind: 'statement', required: false },
        { name: 'score', direction: 'out', kind: 'value', valueType: 'number', required: true },
      ],
    };
  }
}
