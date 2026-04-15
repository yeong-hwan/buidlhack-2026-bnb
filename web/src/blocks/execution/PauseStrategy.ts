import { Block } from '../base';

export class PauseStrategy extends Block {
  readonly type = 'pause_strategy';
  readonly category = 'execution' as const;
  readonly shape = 'stack' as const;
}
