import { Block } from '../base';

export class If extends Block {
  readonly type = 'if';
  readonly category = 'logic' as const;
  readonly shape = 'control' as const;
}
