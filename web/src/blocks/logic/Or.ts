import { Block } from '../base';

export class Or extends Block {
  readonly type = 'or';
  readonly category = 'logic' as const;
  readonly shape = 'boolean' as const;
}
