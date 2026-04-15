import { Block } from '../base';

export class MaOf extends Block {
  readonly type = 'ma_of';
  readonly category = 'input' as const;
  readonly shape = 'value' as const;
  readonly outputType = 'number' as const;

  asset: string = '';
  period: number = 20;
}
