# Block System — 구현 체크리스트 (v2)

완전한 블록 동작을 위한 체크박스 기반 구현 계획.
각 단계는 독립적으로 검증 가능해야 하며, 이전 단계가 완전히 통과되지 않으면 다음 단계로 진행하지 않는다.

참고 문서:
- `docs/block-catalog.md` — 블록 목록 및 shape/slot 규칙
- `docs/block-design.md` — 3층 설계 모델, 포트 기반 설계
- `docs/block-architecture.md` — node+edge+child-slot, 4계층 아키텍처
- `docs/block-snap-engine.md` — 스냅 판정, 드래그 처리

---

## 설계 원칙 (구현 전 필수 숙지)

### Edge vs Child-Slot 연결 규칙

| 연결 종류 | 저장 방식 | 예시 |
|----------|----------|------|
| statement flow (실행 순서) | edge | `every_interval.next → if.prev` |
| value 공급 | edge | `price_of.value → compare.left` |
| boolean 공급 | edge | `compare.result → if.condition` |
| signal 공급 | edge | `emit_signal.signal → bus` |
| nested block 소속 | child-slot | `buy_market ∈ if.children.then` |

**규칙**: nested block(C-block 내부 배치)만 child-slot. 나머지는 전부 edge.

### 좌표계 원칙

- 스냅 연산은 항상 **world 좌표**에서 수행한다 (screen 좌표 아님)
- `screen → world` 변환: `world = (screen - pan) / zoom`
- anchor 위치는 DOM 측정이 아니라 **layout 계산**으로 결정한다

```ts
// 정상
anchor = computeAnchor(blockLayout, portSpec)

// 금지 — DOM 의존, zoom/pan 깨짐, SSR 불가
anchor = element.getBoundingClientRect()
```

---

## Phase 0. 데이터 모델 기반

### 0-1. BlockNode — 정적 타입 data

`data: Record<string, unknown>` 금지. 블록별 타입 유니온으로 정의.

- [x] 블록 data 타입 유니온 정의 (`EveryIntervalData`, `BuyMarketData`, `CompareData`, ... 전체)
- [x] `BlockNode<T extends BlockData = BlockData>` 제네릭 인터페이스 (discriminated union으로 구현)

```ts
// 예시
interface EveryIntervalData { interval: number; unit: IntervalUnit; }
interface BuyMarketData    { asset: string; amount: number; }
type BlockData = EveryIntervalData | BuyMarketData | CompareData | ...;

interface BlockNode {
  id: string;
  type: string;
  data: BlockData;
  x: number;
  y: number;
  children?: Record<string, string[]>;
}
```

### 0-2. Edge

- [x] `Edge` 인터페이스 (`id`, `from: {blockId, port}`, `to: {blockId, port}`)
- [x] `StrategyDocument` 인터페이스 (`blocks: Record<string, BlockNode>`, `edges: Edge[]`)

### 0-3. PortAnchor — layout 기반

DOM이 아니라 layout 계산 결과로 생성.

- [x] `PortAnchor` 인터페이스 (`blockId`, `portName`, `role`, `x`, `y`, `width`, `height`)
- [x] anchor는 world 좌표계 값

### 0-4. EditorState

- [x] `EditorState` 인터페이스
  - `document: StrategyDocument`
  - `draggingBlockId: string | null`
  - `hoverSnapTarget: { blockId: string; portName: string } | null`
  - `zoom: number`
  - `pan: { x: number; y: number }`
  - `validationErrors: ValidationError[]`
  (selectedBlockIds MVP 제외)

### 0-5. CompiledNode — kind 필드 포함

- [x] `CompiledNode` 인터페이스

```ts
interface CompiledNode {
  id: string;
  type: string;
  kind: 'trigger' | 'statement' | 'expression' | 'predicate';
  inputs: Record<string, CompiledNode | LiteralValue>;
  children: Record<string, CompiledNode[]>;
  next?: CompiledNode;
}
```

### 0-6. RuntimeContext

- [x] `RuntimeContext` 인터페이스

```ts
interface RuntimeContext {
  now: number;
  prices: Record<string, number>;
  positions: Record<string, Position>;
  portfolio: PortfolioState;
  signals: SignalBus;
}
```

### 0-7. Signal

- [x] `Signal` 인터페이스

```ts
interface Signal {
  type: SignalType;
  source: string;     // 발행한 블록 id
  strength: number;   // 0~100
  timestamp: number;
}

interface SignalBus {
  emit(signal: Signal): void;
  subscribe(type: SignalType, cb: (s: Signal) => void): () => void;
  latest(type: SignalType): Signal | null;
}
```

### 0-8. ValidationError

- [x] `ValidationError` 인터페이스 (`blockId`, `portName?`, `layer: 'shape'|'type'|'semantics'`, `severity: 'error'|'warning'`, `message`)

### 0-9. 검증

- [ ] `BlockNode` 생성 → JSON 직렬화 → 복원 후 동일한 구조 (Phase 2 store 완료 후 검증)
- [ ] C-block `BlockNode` — `children.then` 배열 순서 보존 확인 (Phase 2 store 완료 후 검증)
- [x] `npx tsc --noEmit` 에러 없음

---

## Phase 1. 블록 레지스트리

### 1-1. 구현

- [x] `BLOCK_REGISTRY: Record<string, new () => Block>` 구현
- [x] 34개 블록 전부 등록
- [x] `createBlockNode(type, x, y): BlockNode` 함수 구현
  - registry에서 클래스 조회
  - 인스턴스 생성 → 기본값 추출 (정적 타입 data 객체 반환)
  - crypto.randomUUID()로 id 생성 → `BlockNode` 반환

### 1-2. 검증

- [x] 존재하는 type → 올바른 `BlockNode` 반환 (타입 레벨 보장, tsc 통과)
- [x] 존재하지 않는 type → 명확한 에러 발생 (throw 구현됨)
- [ ] `createBlockNode('every_interval', ...)` → `data.interval === 1`, `data.unit === 'h'` (Phase 2 UI 후 런타임 검증)
- [ ] `createBlockNode('buy_market', ...)` → `data.asset === ''`, `data.amount === 0` (Phase 2 UI 후 런타임 검증)
- [ ] 34개 블록 전부 `getSpec()` 호출 성공 — inputPorts/outputPorts 비어있지 않음 (Phase 2 UI 후 런타임 검증)

---

## Phase 2. Document State (Zustand store)

### 2-1. Actions 구현

- [ ] `addBlock(node: BlockNode)`
- [ ] `removeBlock(id)` — 연결된 edge + 모든 부모 children 배열에서도 제거
- [ ] `updateBlockData(id, data)` — 필드 값 변경
- [ ] `updateBlockPosition(id, x, y)` — world 좌표
- [ ] `addEdge(edge: Edge)`
- [ ] `removeEdge(id)`
- [ ] `insertIntoChildSlot(parentId, slotName, childId, index)`
- [ ] `removeFromChildSlot(parentId, slotName, childId)`
- [ ] `setZoom(zoom)`, `setPan(x, y)`

### 2-2. Undo/Redo

- [ ] `undo()` / `redo()` 구현
- [ ] 각 action이 history 스택에 쌓임

### 2-3. 검증

- [ ] `addBlock` → store에 블록 추가 확인
- [ ] `removeBlock('b1')` → 'b1'과 연결된 edge + 부모 children에서도 제거됨
- [ ] `insertIntoChildSlot('if1', 'then', 'buy1', 0)` → `blocks['if1'].children.then[0] === 'buy1'`
- [ ] `insertIntoChildSlot('if1', 'then', 'emit1', 1)` → 순서 `['buy1', 'emit1']`
- [ ] `removeFromChildSlot('if1', 'then', 'buy1')` → `['emit1']`만 남음
- [ ] `addBlock → undo → redo` → 상태 정확히 복원됨
- [ ] `addEdge → removeBlock(from.blockId)` → edge도 함께 제거됨

---

## Phase 3. Layout Engine

> **렌더링 전에 먼저 구현한다.** Render는 Layout의 결과를 소비한다.

### 3-1. Block Layout 계산

- [ ] `computeBlockLayout(blockNode, spec): BlockLayout` 구현

```ts
interface BlockLayout {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  portAnchors: Record<string, PortAnchor>;    // world 좌표
  childCavities: Record<string, CavityLayout>; // C-block전용
}

interface CavityLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  insertionPoints: number[]; // 각 child 사이 y 좌표
}
```

- [ ] Hat 블록 기본 크기 계산
- [ ] Stack 블록 — field 수에 따른 height 계산
- [ ] Boolean 블록 — hexagon bounding box 계산
- [ ] Value 블록 — capsule 크기 계산
- [ ] C-block — header + cavity + footer 계산
  - cavity height = child block 합산 + padding
  - child 없을 때 최소 높이(placeholder)

### 3-2. Port Anchor 계산

DOM 측정 금지. layout 값에서 계산.

- [ ] `statement-in` anchor — 블록 상단 중앙 (notch 홈 위치)
- [ ] `statement-out` anchor — 블록 하단 중앙 (notch 돌기 위치)
- [ ] `condition` (boolean-in) — C-block 헤더 condition 슬롯 내부 중앙
- [ ] `value-in` — 해당 field 슬롯 내부 중앙
- [ ] `child-slot` — cavity 영역 상단
- [ ] 모든 anchor는 world 좌표계

### 3-3. C-block 자동 확장

- [ ] child 추가 → cavity height 재계산 → 부모 height 갱신
- [ ] 중첩 C-block — 내부 확장이 외부까지 전파

### 3-4. Zoom/Pan 변환 유틸

- [ ] `screenToWorld(screen, zoom, pan): Point`
- [ ] `worldToScreen(world, zoom, pan): Point`

### 3-5. 검증

- [ ] `computeBlockLayout('if', ...)` → `prev`, `next`, `condition` anchor 3개 존재
- [ ] `computeBlockLayout('compare', ...)` → `left`, `right`, `result` anchor 존재
- [ ] if cavity에 buy_market 1개 추가 → if 블록 전체 height 증가
- [ ] if cavity에 buy_market 2개 → height 추가 증가
- [ ] anchor 좌표 단위 = world 좌표계 (zoom=1, pan=0 기준 일치)
- [ ] zoom=2, pan=(100,100) → screenToWorld → worldToScreen 왕복 오차 없음

---

## Phase 4. 블록 Shape 렌더링

> Layout Engine의 결과를 소비한다. Render는 layout 값을 props로 받아 그리기만 한다.

### 4-1. 공통

- [ ] `<BlockRenderer blockId={id} layout={layout} />` — shape 기반 컴포넌트 분기
- [ ] shape 5종 시각적으로 구분 가능 (hat/stack/c-block/boolean/value)

### 4-2. Hat 블록

- [ ] 상단 라운드 처리 (상단 notch 홈 없음)
- [ ] 하단 notch 돌기 렌더링
- [ ] `EveryInterval`, `WhenSignalReceived`, `WhenNewsArrives`, `ManualRun` 렌더 확인

### 4-3. Stack 블록

- [ ] 상단 notch 홈 + 하단 notch 돌기
- [ ] 필드 inline 편집 UI (숫자/드롭다운/텍스트)
- [ ] `buy_market`, `set_stop_loss`, `emit_signal` 렌더 확인

### 4-4. C-block

- [ ] 헤더 (condition slot) + cavity + footer 구조
- [ ] cavity 높이 — layout.childCavities 값 사용 (DOM 측정 금지)
- [ ] `If` — then child 영역 1개
- [ ] `IfElse` — then / else child 영역 2개
- [ ] cavity 비어있을 때 최소 높이 placeholder 표시

### 4-5. Boolean 블록 (hexagon)

- [ ] 육각형 SVG shape
- [ ] `Compare` — left slot + operator dropdown + right slot 인라인
- [ ] `And`, `Or` — 다중 boolean slot
- [ ] `Not` — 단일 boolean slot

### 4-6. Value 블록 (capsule)

- [ ] pill capsule shape
- [ ] `PriceOf`, `RsiOf`, `MaOf` — 필드 인라인 표시

### 4-7. 검증

- [ ] Hat 블록은 상단에 연결 포인트 없음 시각 확인
- [ ] C-block cavity에 child 추가 시 layout 값 기반으로 height 반영됨
- [ ] Boolean hexagon과 Value capsule 시각적으로 다름
- [ ] 필드 값 편집 → `updateBlockData` 호출 확인
- [ ] Orphan 블록 (미연결) — 흐린 outline으로 표시 (경고, 에러 아님)

---

## Phase 5. Snap Engine

> `canConnect`는 validator의 port 호환성 검사를 사용한다.
> Snap은 독립 모듈이 아니라 validator를 내부적으로 호출한다.

### 5-1. `canConnect` — validator 기반

```ts
canConnect(source: PortAnchor, target: PortAnchor, doc: StrategyDocument): boolean
// = validator.checkPortCompatibility(source, target, doc)
```

- [ ] role 기반 호환성: `statement-out→statement-in`, `boolean-out→boolean-in`, `value-out→value-in`
- [ ] 자기 자신 연결 차단
- [ ] `valueType` 일치 검사 (number↔number, asset↔asset 등)
- [ ] 단일 슬롯 점유 여부 (이미 edge 있는 target port 거부)
- [ ] cycle 생성 여부 검사
- [ ] **world 좌표**로 거리 판정

### 5-2. `findBestSnapTarget` 구현

- [ ] `canConnect` 통과한 후보만 필터링
- [ ] world 좌표 기반 거리 계산
- [ ] 거리 기반 최적 후보 1개 선택 (threshold 기본 40 world unit)
- [ ] threshold 초과 시 null 반환

### 5-3. `applySnap` 구현

- [ ] source anchor → target anchor offset 계산 (world 좌표)
- [ ] 블록 좌표 보정 (연결선이 아니라 블록이 딱 붙음)

### 5-4. Statement 체인 삽입

- [ ] A→B 체인 중간에 X 드롭 → A→X→B 자동 재연결
- [ ] pointer y 기준 삽입 인덱스 계산 (world 좌표 기준)
- [ ] 삽입 위치 horizontal insertion bar 표시

### 5-5. C-block Child Slot 삽입

- [ ] 드래그 블록이 cavity bounds 진입 감지 (world 좌표 기준)
- [ ] `insertIntoChildSlot` 호출
- [ ] 삽입 위치 indicator 표시

### 5-6. 드래그 이벤트

- [ ] `pointerdown` — draggingBlockId 저장, 초기 layout anchor 참조
- [ ] `pointermove` — screen → world 변환 후 rAF throttle, 후보 탐색, highlight 갱신
- [ ] `pointerup` — 최종 snap 판정, edge/child 삽입, layout 재계산

### 5-7. 연결 검증

- [ ] `statement-out → statement-in` 드롭 → edge 생성 + 좌표 보정
- [ ] `statement-out → condition` 드롭 → 거부
- [ ] `boolean-out → if.condition` 드롭 → edge 생성
- [ ] `boolean-out → compare.left` 드롭 → 거부 (value slot ≠ boolean)
- [ ] `value-out(number) → compare.left(number)` → 성공
- [ ] `value-out(number) → compare.left(number)` 재드롭 → 기존 edge 교체
- [ ] `value-out(asset) → compare.left(number)` → 거부 (타입 불일치)
- [ ] A→B 체인 중간 X 드롭 → A→X→B 재연결 확인
- [ ] `buy_market → if` cavity 드롭 → `if.children.then` 편입
- [ ] cycle 생성 시도 (A→B→A) → 거부
- [ ] Hat 블록 상단 드롭 시도 → 거부

### 5-8. 시각적 피드백 검증

- [ ] 드래그 중 호환 슬롯 glow
- [ ] 드래그 중 비호환 슬롯 비활성화
- [ ] statement 삽입 위치 horizontal bar
- [ ] C-block cavity 진입 시 배경 강조
- [ ] 드롭 실패 시 블록 원위치 복귀

---

## Phase 6. 검증기 (Validator)

> Validator는 Snap이 내부적으로 호출한다 (`canConnect`).
> 그 외 전략 전체 검증 (에러 표시용)도 담당한다.

### 6-1. Port 호환성 검사 (Snap에서 사용)

- [ ] `checkPortCompatibility(source, target, doc): ValidationResult`
  - role 호환, valueType 일치, 점유 여부, cycle, 자기연결 포함

### 6-2. 전략 전체 검증

**Layer 1: Shape (문법)**

- [ ] Hat 블록이 strategy root인지 확인
- [ ] Hat 블록의 `prev` 포트에 연결 없음
- [ ] Boolean 블록이 condition slot 외 단독 배치 감지
- [ ] Value 블록이 statement stack에 직접 배치 감지
- [ ] C-block 내부에 Hat 블록 없음

**Layer 2: Type (데이터 계약)**

- [ ] number slot에 non-number value 연결 감지
- [ ] asset slot에 non-asset value 연결 감지
- [ ] signal slot에 non-signal value 연결 감지
- [ ] boolean slot에 non-boolean 연결 감지
- [ ] `required: true` 포트가 미연결인 블록 감지

**Layer 3: Semantics (의미)**

- [ ] `resume_strategy`가 `pause_strategy` 없이 단독 사용 → 경고
- [ ] `kill_switch` 이후에 실행 블록 연결 → 경고
- [ ] 전략에 아무 신호 출력 없음 (`emit_signal` 부재) → 경고

### 6-3. 검증 결과 표시

- [ ] 에러 블록 빨간 outline
- [ ] 경고 블록 노란 outline
- [ ] 에러 메시지 tooltip 또는 패널 표시
- [ ] 에러 없는 상태 → "실행 가능" 표시
- [ ] Orphan 블록 — 흐린 표시 (에러 아님)

### 6-4. 검증 케이스

- [ ] 정상 전략 (`every_interval → if → buy_market`) → 에러 없음
- [ ] Hat 없는 전략 → "시작 블록 없음" 에러
- [ ] `if` 조건 비어있는 전략 → "필수 입력 누락" 에러
- [ ] Boolean 블록 statement stack 단독 배치 → 문법 에러
- [ ] `value(asset)` → `number` slot 연결 → 타입 에러
- [ ] `resume_strategy` 단독 사용 → 의미 경고

---

## Phase 7. 컴파일러

### 7-1. `compile(doc): CompiledGraph`

- [ ] 검증 실패 document → 컴파일 거부 (에러 반환)
- [ ] Trigger root 탐색 (Hat 블록)
- [ ] statement chain → CompiledNode 체인 구성 (`kind: 'statement'`)
- [ ] boolean expression graph 재귀 탐색 (`kind: 'predicate'`)
- [ ] value expression graph 재귀 탐색 (`kind: 'expression'`)
- [ ] C-block child slot → `CompiledNode.children` 변환
- [ ] orphan 블록 (미연결) → compiled graph에서 제외
- [ ] signal flow 처리 (`emit_signal.signal` → SignalBus 연결)

### 7-2. 검증

- [ ] `every_interval → if(compare(price_of, >, ma_of)) → buy_market` → 올바른 CompiledNode 트리
- [ ] statement chain `A → B → C` → 순서 보존 확인
- [ ] `if_else` → `then` / `else` 두 child 배열 모두 존재
- [ ] cycle 있는 document 컴파일 → 에러 발생
- [ ] 검증 실패 document 컴파일 → 컴파일 거부
- [ ] 모든 CompiledNode에 `kind` 필드 정확히 설정

---

## Phase 8. 런타임 실행

### 8-1. Expression Evaluator

- [ ] `evaluateValue(node: CompiledNode, ctx: RuntimeContext): Promise<number | string | ...>`
- [ ] `price_of`, `rsi_of`, `ma_of`, `change_pct_of`, `volume_of`
- [ ] `sentiment_of`, `position_info`, `portfolio_info`

### 8-2. Predicate Evaluator

- [ ] `evaluateBoolean(node: CompiledNode, ctx: RuntimeContext): Promise<boolean>`
- [ ] `compare`, `between`, `and`, `or`, `not`, `keyword_match`

### 8-3. Statement Executor

- [ ] `executeStatement(node: CompiledNode, ctx: RuntimeContext): Promise<void>`
- [ ] `if`, `if_else`
- [ ] `buy_market`, `sell_market`, `close_position`
- [ ] `emit_signal` — Signal 객체 생성 후 `ctx.signals.emit()` 호출
- [ ] `pause_strategy`, `resume_strategy`
- [ ] `set_stop_loss`, `set_take_profit`, `max_position_size`
- [ ] `cooldown_after_loss`, `kill_switch`

### 8-4. Trigger 스케줄러

- [ ] `every_interval` — interval 기반 스케줄러
- [ ] `when_signal_received` — `ctx.signals.subscribe()` 구독
- [ ] `when_news_arrives` — 뉴스 이벤트 구독
- [ ] 발화 시 `RuntimeContext` 생성 (`now`, `prices`, `positions`, `portfolio`, `signals`)

### 8-5. 검증

- [ ] `every_interval → buy_market(BTC, 100)` mock → broker.buy 호출 확인
- [ ] `if(compare(price_of, >, 50000)) → buy_market` — price=60000 → 실행됨
- [ ] `if(compare(price_of, >, 50000)) → buy_market` — price=40000 → 미실행
- [ ] `if_else` — 각 분기 올바르게 실행
- [ ] `and(true, false)` → false, 하위 실행 안 됨
- [ ] `emit_signal(ENTRY, 100)` → Signal `{type:'ENTRY', strength:100}` bus에 발행
- [ ] `when_signal_received(ENTRY) → buy_market` — ENTRY 수신 → 실행됨
- [ ] `kill_switch` 실행 → 이후 블록 미실행
- [ ] `pause_strategy` 후 trigger 발화 → 실행 무시
- [ ] Signal source 필드 — 발행 블록 id 확인

---

## Phase 9. 직렬화 / 저장

- [ ] `StrategyDocument` → JSON 직렬화
- [ ] JSON → `StrategyDocument` 복원
- [ ] 복원 후 블록 위치, edge, children 동일
- [ ] 복원 document → 컴파일 → 실행 성공
- [ ] DB 저장 → 로드 → UI 재구성
- [ ] zoom/pan 값도 함께 직렬화/복원

---

## E2E 시나리오 검증

아래 3가지 전략을 팔레트 드래그부터 실행까지 완성시킬 수 있으면 최종 완료.

### 시나리오 A. 조건 기반 진입

```
every_interval(1h)
  if and(
    compare(price_of(BNB), >, ma_of(BNB, 20)),
    compare(rsi_of(BNB, 14), <, 70)
  )
    emit_signal(ENTRY, 80)
```

- [ ] 팔레트 드래그로 모든 블록 배치
- [ ] 스냅으로 연결 완성 (zoom/pan 상태에서도 정확히 연결)
- [ ] 검증 통과 (에러 없음)
- [ ] 컴파일 성공 — 모든 CompiledNode kind 정확
- [ ] mock 실행 — price>MA, RSI<70 → emit_signal 호출, Signal bus에 ENTRY 발행
- [ ] 저장 → 복원 → 동일하게 실행

### 시나리오 B. 리스크 방어

```
when_signal_received(ENTRY)
  max_position_size(20%)
  set_stop_loss(10%)
  set_take_profit(20%)
```

- [ ] 블록 배치 및 연결
- [ ] 검증 통과
- [ ] 컴파일 성공
- [ ] ENTRY 신호 수신 → 3개 action 순서대로 실행

### 시나리오 C. 드로우다운 방어

```
every_interval(1h)
  if compare(portfolio_info(drawdown), >, 15)
    pause_strategy
    close_position(all)
```

- [ ] 블록 배치 및 연결
- [ ] 검증 통과
- [ ] 컴파일 성공
- [ ] drawdown=20 → pause + close 실행
- [ ] drawdown=10 → 미실행
