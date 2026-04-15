import { Block } from '../base';

export class IfElse extends Block {
  readonly type = 'if_else';
  readonly category = 'logic' as const;
  readonly shape = 'control' as const;
}
