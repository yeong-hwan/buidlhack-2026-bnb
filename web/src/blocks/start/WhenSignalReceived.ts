import { Block } from '../base';

export class WhenSignalReceived extends Block {
  readonly type = 'when_signal_received';
  readonly category = 'start' as const;
  readonly shape = 'hat' as const;

  signal_type: 'ENTRY' | 'EXIT' | 'RISK_ON' | 'RISK_OFF' | 'BULLISH' | 'BEARISH' = 'ENTRY';
}
