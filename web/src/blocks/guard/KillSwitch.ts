import { Block, type BlockSpec } from '../base';

// stack: 전략 즉시 강제 중단. 모든 포지션 청산 후 전략 비활성화
export class KillSwitch extends Block {
  readonly type = 'kill_switch';
  readonly category = 'risk' as const;
  readonly shape = 'stack' as const;

  override getSpec(): BlockSpec {
    return {
      type: this.type,
      category: this.category,
      shape: this.shape,
      inputPorts: [
        { name: 'prev', direction: 'in', kind: 'statement', required: false },
      ],
      outputPorts: [
        // 의도적으로 next 없음: kill_switch 이후 실행 없음
      ],
    };
  }
}
