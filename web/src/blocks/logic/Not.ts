import { Block } from '../base';

export class Not extends Block {
  readonly type = 'not';
  readonly category = 'logic' as const;
  readonly shape = 'boolean' as const;
}
