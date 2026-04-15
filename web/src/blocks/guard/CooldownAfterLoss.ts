import { Block } from '../base';

export class CooldownAfterLoss extends Block {
  readonly type = 'cooldown_after_loss';
  readonly category = 'guard' as const;
  readonly shape = 'stack' as const;

  duration: string = '1h';
}
