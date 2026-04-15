# Block Catalog

전략을 구성하는 언어. **형태 우선, 도메인 보조** 원칙으로 설계.

---

## 핵심 원칙

> shape = 문법 / color·tag = 도메인

사용자가 블록을 보는 순간 아래를 즉시 알 수 있어야 한다:

- 이 블록은 **시작점**인가 → Hat
- 이 블록은 **실행문**인가 → Stack
- 이 블록은 **제어 컨테이너**인가 → Control (C-block)
- 이 블록은 **조건식**인가 → Boolean (Hexagon)
- 이 블록은 **값**인가 → Value (Capsule)

---

## 5가지 블록 형태

| Shape | 시각 | 문법 역할 | 연결 규칙 |
|-------|------|----------|----------|
| **Hat** | 상단 라운드 | 전략 시작점 | 스택 최상단만. 위 연결 불가 |
| **Stack** | 직사각형 + notch | 실행/설정 statement | 위아래 자유 연결 |
| **Control** | C-shape | 제어 컨테이너 | 내부 cavity에 child stack 삽입 |
| **Boolean** | 육각형 (hexagon) | 참/거짓 조건식 | condition slot에만 결합 |
| **Value** | pill capsule | 숫자/데이터 값 | typed value slot에만 결합 |

추가:

| **Aggregator** | 다입력 노드 | 다수 신호 → 단일 판단 | node port 방식 연결 (Consensus 전용) |

---

## 슬롯 타입

| 타입 | 허용 값 | 사용처 |
|------|---------|-------|
| `number` | price_of, rsi_of, ma_of, change_pct_of, 숫자 literal | compare, buy amount, stop loss pct |
| `asset` | BNB, BTC, ETH, custom token | price_of(asset), buy_market(asset) |
| `signal` | ENTRY, EXIT, BULLISH, BEARISH | when_signal_received, emit_signal |
| `text` | 키워드 문자열, 소스명 | keyword_match |
| `boolean` | compare, and, or, not, between, keyword_match | if, if_else condition slot |

---

## 블록 전체 목록

### Hat — 전략 시작점

| 클래스 | type | 필드 |
|--------|------|------|
| `EveryInterval` | `every_interval` | `interval: 1m/5m/1h/1d/1w` |
| `WhenSignalReceived` | `when_signal_received` | `signal_type: ENTRY/EXIT/RISK_ON/RISK_OFF/BULLISH/BEARISH` |
| `WhenNewsArrives` | `when_news_arrives` | `source: news/social/all` |
| `ManualRun` | `manual_run` | 없음 |

---

### Stack — 실행/설정

| 클래스 | type | 도메인 | 필드 |
|--------|------|--------|------|
| `EmitSignal` | `emit_signal` | Signal | `signal_type, strength` |
| `ScoreSignal` | `score_signal` | Decision | `threshold, weights` |
| `ConfirmForNIntervals` | `confirm_for_n_intervals` | Decision | `n` |
| `BuyMarket` | `buy_market` | Execution | `asset, amount` |
| `SellMarket` | `sell_market` | Execution | `asset, amount_pct` |
| `ClosePosition` | `close_position` | Execution | `target (asset or "all")` |
| `PauseStrategy` | `pause_strategy` | Execution | — |
| `ResumeStrategy` | `resume_strategy` | Execution | — |
| `SetStopLoss` | `set_stop_loss` | Risk | `pct` |
| `SetTakeProfit` | `set_take_profit` | Risk | `pct` |
| `MaxPositionSize` | `max_position_size` | Risk | `pct` |
| `CooldownAfterLoss` | `cooldown_after_loss` | Risk | `duration` |
| `KillSwitch` | `kill_switch` | Risk | — |

---

### Control (C-block) — 제어 컨테이너

| 클래스 | type | 구조 |
|--------|------|------|
| `If` | `if` | boolean slot 1개 + child area 1개 |
| `IfElse` | `if_else` | boolean slot 1개 + true child + else child |

> `if_drawdown`은 제거. `if + portfolio_info(drawdown)` 조합으로 대체.

---

### Boolean (Hexagon) — 조건식

| 클래스 | type | 필드 |
|--------|------|------|
| `Compare` | `compare` | `left (number slot), operator: >/>=/</<=/==, right (number slot)` |
| `Between` | `between` | `value (number slot), min, max` |
| `And` | `and` | boolean slot 2개 이상 |
| `Or` | `or` | boolean slot 2개 이상 |
| `Not` | `not` | boolean slot 1개 |
| `KeywordMatch` | `keyword_match` | `keyword (text slot), source` |

---

### Value (Capsule) — 숫자/데이터 값

| 클래스 | type | outputType | 필드 |
|--------|------|------------|------|
| `PriceOf` | `price_of` | number | `asset` |
| `ChangePctOf` | `change_pct_of` | number | `asset, window` |
| `VolumeOf` | `volume_of` | number | `asset, window` |
| `RsiOf` | `rsi_of` | number | `asset, period` |
| `MaOf` | `ma_of` | number | `asset, period` |
| `SentimentOf` | `sentiment_of` | number | `target, source` |
| `PositionInfo` | `position_info` | number | `asset, field: size/entry_price/pnl/holding_time` |
| `PortfolioInfo` | `portfolio_info` | number | `field: total_value/drawdown/daily_pnl/exposure` |

---

### Aggregator — 신호 집계 노드

| 클래스 | type | 필드 |
|--------|------|------|
| `Consensus` | `consensus` | `mode: any/all/majority/weighted` |

> node port 방식. 다수 신호 입력 → 단일 판단 출력. Scratch C-block 방식 대신 사용.

---

## 문법 규칙

```
Hat 위에는 아무것도 붙지 않음
Hat 아래 → Stack / Control만 가능
Stack 아래 → Stack / Control 가능
Control 내부 → Stack / Control만 가능 (Hat 금지)
Boolean → condition slot에만 결합 (Stack 자리에 직접 배치 불가)
Value → typed slot에만 결합 (Stack 자리에 직접 배치 불가)
```

## 타입 규칙

```
number slot ← number value blocks + 숫자 literal
asset slot  ← asset literal (BNB, BTC 등)
signal slot ← signal literal (ENTRY, BULLISH 등)
text slot   ← text literal
boolean slot ← boolean shape blocks (compare, and, or, not, between, keyword_match)
```

---

## 조합 예시

### 패턴 1. 조건 기반 진입
```
[Hat] every_interval(1h)
  [Control] if
    condition: [Boolean] and
      [Boolean] compare([Value] price_of(BNB), >, [Value] ma_of(BNB, 20))
      [Boolean] compare([Value] rsi_of(BNB, 14), <, 70)
    [Stack] emit_signal(ENTRY, 80)
```

### 패턴 2. if_drawdown 대체 패턴
```
[Hat] every_interval(1h)
  [Control] if
    condition: [Boolean] compare([Value] portfolio_info(drawdown), >, 15)
    [Stack] pause_strategy
    [Stack] close_position(all)
```

### 패턴 3. 리스크 방어
```
[Hat] when_signal_received(ENTRY)
  [Stack] max_position_size(20%)
  [Stack] set_stop_loss(10%)
  [Stack] set_take_profit(20%)
```

---

## UI 패널 그룹 (1차: Shape / 2차: 도메인 색상)

```
Start (hat)       — Every interval, When signal received, When news arrives
                    Manual run
Actions (stack)   — Emit signal, Buy, Sell, Close, Pause, Resume,
                    Stop loss, Take profit, Max position, Cooldown, Kill switch
Controls          — If, If else
Conditions (hex)  — Compare, Between, And, Or, Not, Keyword match
Values (capsule)  — Price, Change %, Volume, RSI, MA, Sentiment,
                    Position info, Portfolio info
Decision          — Consensus (aggregator), Score signal, Confirm N intervals
```

---

## 소스 경로

```
web/src/blocks/
  base.ts          — BlockShape, PortSpec, Block 추상 클래스
  index.ts         — 전체 export
  start/           Hat: EveryInterval, WhenSignalReceived, WhenNewsArrives, ManualRun
  input/           Value: PriceOf, ChangePctOf, VolumeOf, RsiOf, MaOf,
                         SentimentOf, PositionInfo, PortfolioInfo
  logic/           Control: If, IfElse
                   Boolean: And, Or, Not, Compare, Between, KeywordMatch
  decision/        Stack: EmitSignal, ScoreSignal, ConfirmForNIntervals
                   C-block: Consensus
  execution/       Stack: BuyMarket, SellMarket, ClosePosition,
                         PauseStrategy, ResumeStrategy
  guard/           Stack: SetStopLoss, SetTakeProfit, MaxPositionSize,
                         CooldownAfterLoss, KillSwitch
```

*총 34개 블록 (IfDrawdown 제거, ManualRun 포함)*
