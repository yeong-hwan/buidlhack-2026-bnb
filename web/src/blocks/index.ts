// Start (hat)
export { EveryInterval } from './start/EveryInterval';
export { WhenSignalReceived } from './start/WhenSignalReceived';
export { WhenNewsArrives } from './start/WhenNewsArrives';
export { ManualRun } from './start/ManualRun';

// Input — value (capsule)
export { PriceOf } from './input/PriceOf';
export { ChangePctOf } from './input/ChangePctOf';
export { VolumeOf } from './input/VolumeOf';
export { RsiOf } from './input/RsiOf';
export { MaOf } from './input/MaOf';
export { SentimentOf } from './input/SentimentOf';
export { PositionInfo } from './input/PositionInfo';
export { PortfolioInfo } from './input/PortfolioInfo';

// Logic — c-block (control) / boolean (hexagon)
// KeywordMatch은 boolean shape이므로 logic으로 분류
export { If } from './logic/If';
export { IfElse } from './logic/IfElse';
export { And } from './logic/And';
export { Or } from './logic/Or';
export { Not } from './logic/Not';
export { Compare } from './logic/Compare';
export { Between } from './logic/Between';
export { KeywordMatch } from './logic/KeywordMatch';

// Decision — stack / c-block
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

// Guard / Risk — stack
export { SetStopLoss } from './guard/SetStopLoss';
export { SetTakeProfit } from './guard/SetTakeProfit';
export { MaxPositionSize } from './guard/MaxPositionSize';
export { CooldownAfterLoss } from './guard/CooldownAfterLoss';
export { KillSwitch } from './guard/KillSwitch';

export type { Block, BlockCategory, BlockShape, BlockSpec, PortSpec, ChildSlotSpec, PortDirection, PortKind, ValueType } from './base';
export type { IntervalUnit, SignalType, NewsSource, SentimentSource, CompareOperator, ConsensusMode, PositionField, PortfolioField } from './types';

// Phase 0: 데이터 모델
export type {
  BlockData, BlockType, BlockTypeDataMap,
  EveryIntervalData, WhenSignalReceivedData, WhenNewsArrivesData, ManualRunData,
  PriceOfData, ChangePctOfData, VolumeOfData, RsiOfData, MaOfData,
  SentimentOfData, PositionInfoData, PortfolioInfoData,
  IfData, IfElseData, AndData, OrData, NotData, CompareData, BetweenData, KeywordMatchData,
  EmitSignalData, ScoreSignalData, ConfirmForNIntervalsData, ConsensusData,
  BuyMarketData, SellMarketData, ClosePositionData, PauseStrategyData, ResumeStrategyData,
  SetStopLossData, SetTakeProfitData, MaxPositionSizeData, CooldownAfterLossData, KillSwitchData,
} from './data';

export type {
  BlockNode, Edge, StrategyDocument,
  PortRole, PortAnchor,
  ValidationLayer, ValidationSeverity, ValidationError,
  EditorState, Point, Signal,
} from './document';
export { screenToWorld, worldToScreen } from './document';

export type {
  LiteralValue, CompiledNodeKind, CompiledNode,
  Position, PortfolioState, SignalBus, RuntimeContext, CompiledGraph,
} from './runtime';
