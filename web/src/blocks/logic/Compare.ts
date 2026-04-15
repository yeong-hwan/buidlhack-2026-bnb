import { Block } from '../base';

export class Compare extends Block {
  readonly type = 'compare';
  readonly category = 'logic' as const;
  readonly shape = 'boolean' as const;

  left: string = '';
  operator: '>' | '>=' | '<' | '<=' | '==' = '>';
  right: string = '';
}
