import { Block } from '../base';

export class EveryInterval extends Block {
  readonly type = 'every_interval';
  readonly category = 'start' as const;
  readonly shape = 'hat' as const;

  interval: '1m' | '5m' | '1h' | '1d' | '1w' = '1h';
}
