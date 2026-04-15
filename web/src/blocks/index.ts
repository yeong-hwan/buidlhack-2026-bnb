// Start (hat)
export { EveryInterval } from './start/EveryInterval';
export { WhenSignalReceived } from './start/WhenSignalReceived';
export { WhenNewsArrives } from './start/WhenNewsArrives';

// Input — value (capsule), keyword_match은 boolean (hexagon)
export { PriceOf } from './input/PriceOf';
export { ChangePctOf } from './input/ChangePctOf';
export { VolumeOf } from './input/VolumeOf';
export { RsiOf } from './input/RsiOf';
export { MaOf } from './input/MaOf';
export { SentimentOf } from './input/SentimentOf';
export { KeywordMatch } from './input/KeywordMatch';
export { PositionInfo } from './input/PositionInfo';
export { PortfolioInfo } from './input/PortfolioInfo';

// Logic — control (C-block) / boolean (hexagon)
export { If } from './logic/If';
export { IfElse } from './logic/IfElse';
export { And } from './logic/And';
export { Or } from './logic/Or';
export { Not } from './logic/Not';
export { Compare } from './logic/Compare';
export { Between } from './logic/Between';

// Decision — stack / aggregator
export { EmitSignal } from './decision/EmitSignal';
export { ScoreSignal } from './decision/ScoreSignal';
export { ConfirmForNIntervals } from './decision/ConfirmForNIntervals';
export { Consensus } from './decision/Consensus';

// Execution — stack
export { BuyMarket } from './execution/BuyMarket';
export { SellMarket } from './execution/SellMarket';
export { ClosePosition } from './execution/ClosePosition';
export { PauseStrategy } from './execution/PauseStrategy';
export { ResumeStrategy } from './execution/ResumeStrategy';

// Guard — stack
export { SetStopLoss } from './guard/SetStopLoss';
export { SetTakeProfit } from './guard/SetTakeProfit';
export { MaxPositionSize } from './guard/MaxPositionSize';
export { CooldownAfterLoss } from './guard/CooldownAfterLoss';
export { KillSwitch } from './guard/KillSwitch';

export type { Block, BlockCategory, BlockShape, SlotType } from './base';
