import { Block } from '../base';

export class ScoreSignal extends Block {
  readonly type = 'score_signal';
  readonly category = 'decision' as const;
  readonly shape = 'stack' as const;

  threshold: number = 70;
  weights: Record<string, number> = {};
}
