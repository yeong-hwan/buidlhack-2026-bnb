import { Block } from '../base';

export class Between extends Block {
  readonly type = 'between';
  readonly category = 'logic' as const;
  readonly shape = 'boolean' as const;

  value: string = '';
  min: number = 0;
  max: number = 100;
}
