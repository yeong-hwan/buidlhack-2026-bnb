import { Block } from '../base';

export class And extends Block {
  readonly type = 'and';
  readonly category = 'logic' as const;
  readonly shape = 'boolean' as const;
}
