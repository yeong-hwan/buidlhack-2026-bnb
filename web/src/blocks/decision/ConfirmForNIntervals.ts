import { Block } from '../base';

export class ConfirmForNIntervals extends Block {
  readonly type = 'confirm_for_n_intervals';
  readonly category = 'decision' as const;
  readonly shape = 'stack' as const;

  n: number = 3;
}
