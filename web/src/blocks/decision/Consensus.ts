import { Block, type BlockSpec } from '../base';
import type { ConsensusMode } from '../types';

// c-block: 다수 신호 입력을 mode 기준으로 집계 → 최종 판단 신호 출력
// child slot에 emit_signal 블록들을 넣어 신호를 모음
export class Consensus extends Block {
  readonly type = 'consensus';
  readonly category = 'decision' as const;
  readonly shape = 'c-block' as const;

  mode: ConsensusMode = 'majority'; // any | all | majority | weighted

  override getSpec(): BlockSpec {
    return {
      type: this.type,
      category: this.category,
      shape: this.shape,
      inputPorts: [
        { name: 'prev', direction: 'in', kind: 'statement', required: false },
        { name: 'mode', direction: 'in', kind: 'value', valueType: 'enum', required: true },
      ],
      outputPorts: [
        { name: 'next', direction: 'out', kind: 'statement', required: false },
        { name: 'signal', direction: 'out', kind: 'signal', valueType: 'signal', required: true },
      ],
      childSlots: [
        { name: 'signals', multiple: true }, // emit_signal 블록들을 여기에 배치
      ],
    };
  }
}
