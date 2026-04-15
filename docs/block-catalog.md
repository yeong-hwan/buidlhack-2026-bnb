# Block Catalog

AgentBlock 블록 전체 목록 — 검수/기획용 문서

---

## 블록 형태 (Shape)

| 형태 | 역할 | 위치 규칙 |
|------|------|----------|
| **HAT** | 트리거 — 조건 발생 시 실행 시작 | 스택 **최상단** 필수 |
| **STACK** | 액션/필터 — 실행 로직 | 중간 어디든 가능 |
| **C-BLOCK** | 반복/조건 — 내부에 블록 포함 | 중간, 자식 블록 소유 |
| **CAP** | 출력 — 신호를 다음 에이전트에 전달 | 스택 **최하단** 필수 |

---

## 에이전트별 블록

### 🟡 Data Feed (amber `#f59e0b`)

> 역할: 외부 매크로 데이터 수신 → `RISK_ON` / `RISK_OFF` 신호를 하위 에이전트에 전달

| type | shape | keyword | label | 필드 |
|------|-------|---------|-------|------|
| `feed_nasdaq` | HAT | feed | NASDAQ futures | CONDITION (select: above/below 20D MA, up/down >1%) |
| `feed_interest_rate` | HAT | feed | Fed rate | CHANGE (select: cut / hike / any) |
| `feed_fx_rate` | HAT | feed | FX rate | PAIR (USD/KRW, EUR/USD, DXY), THRESHOLD (number) |
| `feed_commodity` | HAT | feed | commodity | ASSET (Gold/Silver/Oil), DIRECTION (up/down) |
| `feed_fear_greed` | HAT | feed | Fear & Greed | ZONE (Extreme Fear / Fear / Greed / Extreme Greed) |
| `feed_vix` | HAT | feed | VIX | OPERATOR (>=/<= ), THRESHOLD (number) |
| `feed_emit` | CAP | → out | data signal | SIGNAL (RISK_ON / RISK_OFF / NEUTRAL) |

---

### 🔵 Alpha Agent (cyan `#22d3ee`)

> 역할: 가격·거래량·모멘텀 분석 → `BUY` / `SELL` / `HOLD` 신호를 Manager에 전달

| type | shape | keyword | label | 필드 |
|------|-------|---------|-------|------|
| `alpha_when_momentum` | HAT | when | momentum | DIRECTION (rises above / falls below), PERIOD (days) |
| `alpha_when_price` | HAT | when | price | TOKEN (BNB/ETH/BTC), OPERATOR (>=/<=/>/<), VALUE |
| `alpha_when_volume` | HAT | when | volume | MULTIPLIER (× avg) |
| `alpha_ai_decide` | STACK | AI | autonomous | CONTEXT (market/cross-asset/all), CONFIDENCE (%) |
| `alpha_emit_signal` | CAP | → out | signal | SIGNAL (BUY/SELL/HOLD), STRENGTH (%) |

---

### 🟣 News Agent (violet `#a78bfa`)

> 역할: 뉴스·소셜 감성 분석 → `BULLISH` / `BEARISH` 신호를 Manager에 전달

| type | shape | keyword | label | 필드 |
|------|-------|---------|-------|------|
| `news_when_sentiment` | HAT | when | sentiment | SENTIMENT (positive / negative / neutral) |
| `news_when_keyword` | HAT | when | keyword | KEYWORD (text), SOURCE (news/Twitter/Reddit) |
| `news_semantic_filter` | STACK | AI | semantic match | QUERY (text), THRESHOLD (0~1) |
| `news_emit_signal` | CAP | → out | news signal | SIGNAL (BULLISH / BEARISH / NEUTRAL) |

---

### 🟢 Manager (emerald `#34d399`)

> 역할: 신호 수신 → PancakeSwap/market에 실제 온체인 주문 실행

| type | shape | keyword | label | 필드 |
|------|-------|---------|-------|------|
| `mgr_on_signal` | HAT | on | signal | SIGNAL (BUY/SELL/BULLISH/BEARISH) |
| `mgr_buy` | STACK | buy | token | AMOUNT (USDT), TOKEN, DEX (PancakeSwap/market) |
| `mgr_sell` | STACK | sell | token | AMOUNT_PCT (%), TOKEN |
| `mgr_dca` | STACK | dca | order | AMOUNT (USDT), TOKEN, INTERVAL (daily/weekly/monthly) |
| `mgr_rebalance` | STACK | rebal | portfolio | TOKEN, TARGET_PCT (%) |
| `mgr_repeat` | C-BLOCK | repeat | every | N (number), UNIT (hours/days/weeks) |

---

### 🔴 Risk Agent (rose `#fb7185`)

> 역할: 손실 방어 가드레일 — 전략 실행 중 항상 활성

| type | shape | keyword | label | 필드 |
|------|-------|---------|-------|------|
| `risk_set_stop_loss` | STACK | stop | loss | PCT (%) |
| `risk_set_take_profit` | STACK | take | profit | PCT (%) |
| `risk_max_position` | STACK | max | position | MAX_USDT |
| `risk_max_drawdown` | STACK | if | drawdown | PCT (%) → pause |
| `risk_daily_loss_limit` | STACK | daily | loss limit | LIMIT_USDT |

---

## 검증 규칙 (컴파일러)

### 인트라 에이전트

| 심각도 | 조건 | 메시지 |
|--------|------|--------|
| ⚠️ warning | HAT 블록이 index 0이 아닐 때 | 트리거 블록은 최상단에 있어야 함 |
| ⚠️ warning | CAP 블록이 마지막이 아닐 때 | 출력 블록은 최하단에 있어야 함 |
| ⚠️ warning | index 0 블록이 HAT/C-BLOCK이 아닐 때 | 트리거 블록으로 시작해야 함 |
| ⚠️ warning | Data/Alpha/News에 emit 블록 없음 | 신호가 하위 에이전트에 전달되지 않음 |
| ⚠️ warning | Manager에 액션 블록은 있는데 `mgr_on_signal` 없음 | 신호 수신 없이 액션 실행 불가 |

### 크로스 에이전트

| 심각도 | 조건 | 메시지 |
|--------|------|--------|
| ⚠️ warning | Manager 있는데 Alpha/News 모두 비어있음 | 신호 소스 없음 |
| 🔴 error | Manager 있는데 Risk 에이전트 비어있음 | 안전장치 없음 — 최소 손절 필요 |

---

## 논의 필요 — 추가 후보 블록

### Data Feed
- `feed_crypto_price` (HAT) — 온체인 토큰 가격 트리거
- `feed_funding_rate` (HAT) — 선물 자금조달비율 감지
- `feed_whale_alert` (HAT) — 대량 온체인 이동 감지

### Alpha Agent
- `alpha_rsi` (HAT) — RSI 과매수/과매도 트리거
- `alpha_ma_cross` (HAT) — 골든/데드 크로스
- `alpha_bollinger` (HAT) — 볼린저 밴드 이탈

### News Agent
- `news_when_onchain_event` (HAT) — 청산, 대량 이동 등 온체인 이벤트

### Manager
- `mgr_limit_order` (STACK) — 지정가 주문
- `mgr_if_signal` (C-BLOCK) — 조건부 실행 (if BUY then …)

### Risk Agent
- `risk_trailing_stop` (STACK) — 트레일링 손절
- `risk_max_trades_per_day` (STACK) — 일일 거래 횟수 제한
- `risk_cool_down` (STACK) — 손실 후 쿨다운 기간

---

*총 28개 블록 구현 완료 · 후보 13개 검토 중*
