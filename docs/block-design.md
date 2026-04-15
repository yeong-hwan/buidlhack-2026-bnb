# Block Design Principles

블록 시스템의 설계 철학 및 구조 원칙.
`block-catalog.md`는 블록 목록이고, 이 문서는 **블록이 어떻게 설계되어야 하는지**를 다룬다.

---

## 왜 단순 in/out 모델로는 안 되는가

블록은 함수처럼 보이지만 함수가 아니다.

| 블록 | 단순 in/out으로 설명 시 문제 |
|------|--------------------------|
| `buy_market` | 무엇을 반환하는가? void? order_result? — 실제론 "액션"이지 value producer가 아님 |
| `if` | 출력이 없는가? — 실제론 control-flow를 바꾸므로 data out으로 설명 불가 |
| `every_interval` | tick event를 반환? — 값을 만드는 블록이 아니라 실행 시작 조건 |

결론: 블록에는 적어도 5가지 역할이 있고, 하나의 in/out 모델로 통일하면 설계가 깨진다.

---

## 왜 연결 관계만으로도 안 되는가

연결 가능성은 **문법 검증**에는 유용하지만, 실행 의미를 설명하지 못한다.

```
compare(price_of(BTC), >, ma_of(BTC, 20))
```

연결 관계는 맞다. 그러나 이것만으로는 아래를 알 수 없다:

- 언제 평가되는가
- 어떤 context에서 평가되는가
- 실시간 값인가, 마지막 봉 기준인가
- 캐시되는가

```
set_stop_loss(10%)
```

연결은 가능하지만 이것만으로는 알 수 없다:

- 현재 포지션이 없으면 무시?
- 다음 주문에만 적용?
- 기존 포지션에도 소급 적용?

결론: 연결 관계 = 문법 검증. 실행 엔진 설계에는 부족하다.

---

## 3층 설계 모델

```
Layer 1: Shape / Grammar        — 어떤 위치에 놓일 수 있는가
Layer 2: Type / Data Contract   — 어떤 타입을 주고받는가
Layer 3: Execution Semantics    — 실행 시 무슨 일이 일어나는가
```

이 3개를 분리해서 설계해야 한다. 하나로 합치면 각 레이어의 검증 로직이 뒤섞인다.

---

## 5가지 블록 인터페이스

모든 블록을 같은 베이스 클래스로만 처리하지 말고, 실행 역할 기준으로 인터페이스를 분리한다.

### A. Expression Block — 값 계산

예: `price_of`, `rsi_of`, `portfolio_info`, `sentiment_of`

```
evaluate(context) -> value
```

- 외부 상태를 **읽는다**
- 아무것도 실행하지 않는다
- 동일 context에서 여러 번 호출해도 결과가 같아야 한다 (idempotent)

---

### B. Predicate Block — 참/거짓 계산

예: `compare`, `between`, `and`, `or`, `not`, `keyword_match`

```
evaluate(context) -> bool
```

- Expression block과 유사하지만 출력이 반드시 boolean
- `if`의 condition slot에만 결합 가능
- 직접 statement stack에 놓일 수 없다

---

### C. Statement Block — 실행

예: `buy_market`, `sell_market`, `emit_signal`, `pause_strategy`, `set_stop_loss`

```
execute(context) -> ExecutionResult
```

- 외부 상태를 **바꾼다**
- side effect 있음
- statement stack에만 놓인다

---

### D. Trigger Block — 실행 시작 이벤트

예: `every_interval`, `when_signal_received`, `when_news_arrives`

```
subscribe() / should_fire(event) -> bool / create_context() -> EvalContext
```

- 스케줄러 또는 이벤트 시스템에 등록된다
- 발화 시 evaluation context를 생성한다
- 스택 최상단(root head)에만 위치한다

---

### E. Control Block — 자식 흐름 제어

예: `if`, `if_else`

```
execute(context) -> ExecutionResult
child_blocks: Statement[]
```

- 자체로는 statement이지만 내부에 child statement stack을 보유
- Predicate block을 condition slot으로 받는다
- 자식 블록의 실행 여부를 결정한다

---

## Port 기반 설계

블록마다 포트를 정의한다. 포트는 연결 규칙 + 타입 계약을 동시에 표현한다.

### 포트 종류

| port_kind | 설명 |
|-----------|------|
| `statement_in` | 위쪽 stack 연결 |
| `statement_out` | 아래쪽 stack 연결 |
| `condition_in` | boolean block 수신 (if 전용) |
| `value_in` | value/number 수신 슬롯 |
| `value_out` | value/number 송신 |
| `child_statement_in` | 내부 child stack 수신 (control 전용) |
| `trigger_out` | 실행 이벤트 발화 (trigger 전용) |
| `signal_in` | signal enum 수신 |
| `signal_out` | signal enum 송신 |

### PortSpec

```
PortSpec {
  name: string
  direction: "in" | "out"
  port_kind: string
  value_type: "number" | "boolean" | "asset" | "signal" | "text" | null
  required: boolean
  multiple: boolean  // and/or처럼 여러 입력 가능한 경우
}
```

`port_kind`와 `value_type`을 분리하는 게 핵심이다.

예:
- `port_kind="value"`, `value_type="number"` → 숫자 값 슬롯
- `port_kind="statement"`, `value_type=null` → stack 연결

### 블록별 포트 예시

#### `price_of`
```
inputs:  asset (value_in, asset)
outputs: value_out (number)
```

#### `compare`
```
inputs:  left (value_in, number), operator (inline enum), right (value_in, number)
outputs: value_out (boolean)
```

#### `if`
```
inputs:  condition_in (boolean), child_statement_in (statements[])
outputs: statement_out
```

#### `buy_market`
```
inputs:  asset (value_in, asset), amount (value_in, number)
outputs: statement_out
```

#### `every_interval`
```
inputs:  interval (inline enum)
outputs: trigger_out
```

---

## BlockSpec 전체 구조

각 블록 클래스가 가져야 할 최소 메타데이터:

```
BlockSpec {
  type_name: string            // "price_of", "buy_market" 등
  category: string             // start | input | logic | decision | execution | guard
  shape: string                // hat | stack | control | boolean | value | aggregator
  execution_kind: string       // expression | predicate | statement | trigger | control

  input_ports: PortSpec[]
  output_ports: PortSpec[]
  child_slots: ChildSlotSpec[] // control block 전용

  reads_state: string[]        // ["portfolio", "position", "market_price"]
  writes_state: string[]       // ["order", "strategy_state", "stop_loss"]
}
```

### 상태 읽기/쓰기 분류

| 블록 | reads_state | writes_state |
|------|-------------|--------------|
| `position_info` | `["position"]` | `[]` |
| `portfolio_info` | `["portfolio"]` | `[]` |
| `price_of` | `["market_price"]` | `[]` |
| `buy_market` | `[]` | `["order", "position"]` |
| `set_stop_loss` | `[]` | `["stop_loss"]` |
| `cooldown_after_loss` | `["trade_history"]` | `["cooldown_state"]` |
| `pause_strategy` | `[]` | `["strategy_state"]` |

상태 의존성을 초기에 분리하지 않으면 실행 엔진 설계 시 충돌이 발생한다.

---

## 4단계 검증 모델

블록 엔진은 아래 순서로 판단한다.

### 1단계: 문법 검증 (Shape)

- Hat은 스택 루트인가
- Boolean block이 condition slot에만 들어갔는가
- Value block이 statement stack에 직접 놓이지 않았는가
- Control block 내부에 Hat이 없는가

### 2단계: 타입 검증 (Data Contract)

- `price_of` 결과(number)가 number slot에 들어갔는가
- `sentiment_of` 결과(number)가 `compare`에 들어갔는가
- signal enum이 signal slot에 들어갔는가
- asset literal이 asset slot에 들어갔는가

### 3단계: 의미 검증 (Semantics)

- `set_stop_loss` 전에 포지션 관련 context가 존재하는가
- `close_position` 대상이 실제 보유 가능한 상태인가
- `resume_strategy`가 `pause_strategy` 없이 단독으로 쓰이는가
- `cooldown_after_loss`가 실행 이력 없이 쓰이는가

### 4단계: 실행 계획 생성

- Trigger 등록 (scheduler / event system)
- Evaluation graph 구성 (expression + predicate 평가 순서)
- Statement sequence 생성 (실행 순서 결정)
- State dependency graph 구성 (reads/writes 충돌 감지)

---

## 설계 원칙 요약

| 관점 | 설명 |
|------|------|
| 블록은 함수가 아니다 | 값 반환, 조건 반환, 실행, 흐름 제어, 이벤트 발화 — 5가지 역할이 존재 |
| in/out만으로는 부족하다 | 실행 의미와 상태 의존성이 누락됨 |
| 연결 관계만으로는 부족하다 | 문법 검증은 되지만 실행 엔진 설계에 부족 |
| 3층 분리가 핵심 | shape/grammar + type/contract + execution semantics |
| 포트 기반으로 설계 | 연결성 + 타입 계약을 동시에 표현 |
| 상태 의존성 명시 | reads_state / writes_state 분리 필수 |
