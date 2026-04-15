import { Block } from '../base';

export class EmitSignal extends Block {
  readonly type = 'emit_signal';
  readonly category = 'decision' as const;
  readonly shape = 'stack' as const;

  signal_type: 'ENTRY' | 'EXIT' | 'RISK_ON' | 'RISK_OFF' | 'BULLISH' | 'BEARISH' = 'ENTRY';
  strength: number = 80;
}
