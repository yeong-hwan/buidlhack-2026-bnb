import { Block } from '../base';

export class VolumeOf extends Block {
  readonly type = 'volume_of';
  readonly category = 'input' as const;
  readonly shape = 'value' as const;
  readonly outputType = 'number' as const;

  asset: string = '';
  window: string = '1h';
}
