import { Block } from '../base';

export class KillSwitch extends Block {
  readonly type = 'kill_switch';
  readonly category = 'guard' as const;
  readonly shape = 'stack' as const;
}
