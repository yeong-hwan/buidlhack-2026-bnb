# Block System — 구현 체크리스트

완전한 블록 동작을 위한 체크박스 기반 구현 계획.
각 단계는 독립적으로 검증 가능해야 하며, 이전 단계가 완전히 통과되지 않으면 다음 단계로 진행하지 않는다.

참고 문서:
- `docs/block-catalog.md` — 블록 목록 및 shape/slot 규칙
- `docs/block-design.md` — 3층 설계 모델, 포트 기반 설계
- `docs/block-architecture.md` — node+edge+child-slot, 4계층 아키텍처
- `docs/block-snap-engine.md` — 스냅 판정, 드래그 처리

---

## Phase 0. 데이터 모델 기반

### 0-1. 핵심 타입 정의

- [ ] `BlockNode` 인터페이스 (`id`, `type`, `data`, `x`, `y`, `children?`)
- [ ] `Edge` 인터페이스 (`id`, `from: {blockId, port}`, `to: {blockId, port}`)
- [ ] `StrategyDocument` 인터페이스 (`blocks: BlockNode[]`, `edges: Edge[]`)
- [ ] `PortAnchor` 인터페이스 (`blockId`, `portName`, `role`, `x`, `y`, `width`, `height`)
- [ ] `EditorState` 인터페이스 (`blocks`, `edges`, `draggingBlockId`, `hoverSnapTarget`)
- [ ] `CompiledNode` 인터페이스 (`id`, `type`, `resolvedInputs`, `children`, `next?`)

### 0-2. 검증

- [ ] `BlockNode` 생성 → JSON 직렬화 → 복원 후 동일한 구조
- [ ] C-block `BlockNode` — `children.then` 배열 순서 보존 확인
- [ ] `npx tsc --noEmit` 에러 없음

---

## Phase 1. 블록 레지스트리

### 1-1. 구현

- [ ] `BLOCK_REGISTRY: Record<string, new () => Block>` 구현
- [ ] 34개 블록 전부 등록
- [ ] `createBlockNode(type, x, y): BlockNode` 함수 구현
  - registry에서 클래스 조회
  - 인스턴스 생성 → 기본값 추출
  - uuid로 id 생성 → `BlockNode` 반환

### 1-2. 검증

- [ ] 존재하는 type → 올바른 `BlockNode` 반환
- [ ] 존재하지 않는 type → 명확한 에러 발생
- [ ] `createBlockNode('every_interval', ...)` → `data.interval === 1`, `data.unit === 'h'`
- [ ] `createBlockNode('buy_market', ...)` → `data.asset === ''`, `data.amount === 0`
- [ ] 34개 블록 전부 `getSpec()` 호출 성공 — inputPorts/outputPorts 비어있지 않음

---

## Phase 2. Document State (Zustand store)

### 2-1. Actions 구현

- [ ] `addBlock(node: BlockNode)`
- [ ] `removeBlock(id)` — 연결된 edge 함께 제거
- [ ] `updateBlockData(id, data)` — 필드 값 변경
- [ ] `updateBlockPosition(id, x, y)`
- [ ] `addEdge(edge: Edge)`
- [ ] `removeEdge(id)`
- [ ] `insertIntoChildSlot(parentId, slotName, childId, index)`
- [ ] `removeFromChildSlot(parentId, slotName, childId)`

### 2-2. Undo/Redo

- [ ] `undo()` / `redo()` 구현
- [ ] 각 action이 history 스택에 쌓임

### 2-3. 검증

- [ ] `addBlock` → store에 블록 추가 확인
- [ ] `removeBlock('b1')` → 'b1'과 연결된 edge도 함께 제거됨
- [ ] `insertIntoChildSlot('if1', 'then', 'buy1', 0)` → `blocks['if1'].children.then[0] === 'buy1'`
- [ ] `insertIntoChildSlot('if1', 'then', 'emit1', 1)` → 순서 `['buy1', 'emit1']`
- [ ] `removeFromChildSlot('if1', 'then', 'buy1')` → `['emit1']`만 남음
- [ ] `addBlock → undo → redo` → 상태 정확히 복원됨
- [ ] `addEdge → removeBlock(from.blockId)` → edge도 함께 제거됨

---

## Phase 3. 블록 Shape 렌더링

### 3-1. 공통

- [ ] `<BlockRenderer blockId={id} />` — shape 기반 컴포넌트 분기
- [ ] shape 5종 시각적으로 구분 가능 (hat/stack/c-block/boolean/value)

### 3-2. Hat 블록

- [ ] 상단 라운드 처리 (상단 notch 홈 없음)
- [ ] 하단 notch 돌기 렌더링
- [ ] `EveryInterval`, `WhenSignalReceived`, `WhenNewsArrives`, `ManualRun` 렌더 확인

### 3-3. Stack 블록

- [ ] 상단 notch 홈 + 하단 notch 돌기
- [ ] 필드 inline 편집 UI (숫자/드롭다운/텍스트)
- [ ] `buy_market`, `set_stop_loss`, `emit_signal` 렌더 확인

### 3-4. C-block

- [ ] 헤더 (condition slot) + cavity + footer 구조
- [ ] cavity 높이 — child 개수에 따라 동적 확장
- [ ] `If` — then child 영역 1개
- [ ] `IfElse` — then / else child 영역 2개
- [ ] cavity 비어있을 때 최소 높이 placeholder 표시

### 3-5. Boolean 블록 (hexagon)

- [ ] 육각형 SVG shape
- [ ] `Compare` — left slot + operator dropdown + right slot 인라인
- [ ] `And`, `Or` — 다중 boolean slot
- [ ] `Not` — 단일 boolean slot

### 3-6. Value 블록 (capsule)

- [ ] pill capsule shape
- [ ] `PriceOf`, `RsiOf`, `MaOf` — 필드 인라인 표시

### 3-7. 검증

- [ ] Hat 블록은 상단에 연결 포인트 없음 시각 확인
- [ ] C-block cavity에 child 추가 시 부모 height 확장
- [ ] Boolean hexagon과 Value capsule 시각적으로 다름
- [ ] 필드 값 편집 → `updateBlockData` 호출 확인

---

## Phase 4. Port Anchor 시스템

### 4-1. Anchor 측정 및 등록

- [ ] 블록 render 후 `useLayoutEffect`로 포트 DOM 위치 측정
- [ ] `portAnchorRegistry: Record<'blockId:portName', PortAnchor>` 관리
- [ ] 블록 이동 시 anchor 위치 갱신

### 4-2. 포트별 anchor 위치 규칙

- [ ] `statement-in` — 블록 상단 중앙
- [ ] `statement-out` — 블록 하단 중앙
- [ ] `condition` (boolean-in) — C-block 헤더의 condition slot 내부
- [ ] `value-in` — 해당 필드 슬롯 내부 중앙
- [ ] `child-slot` — cavity 영역 내부

### 4-3. 검증

- [ ] 블록 렌더 후 해당 블록의 모든 포트 anchor가 registry에 존재
- [ ] `if` 블록 — `prev`, `next`, `condition` 3개 anchor 존재
- [ ] `compare` 블록 — `left`, `operator`, `right`, `result` anchor 존재
- [ ] anchor 좌표가 실제 DOM 위치와 일치 (getBoundingClientRect 비교)
- [ ] 블록 드래그 이동 후 anchor 좌표 갱신됨

---

## Phase 5. Snap Engine

### 5-1. `canConnect` 구현

- [ ] role 기반 호환성: `statement-out→statement-in`, `boolean-out→boolean-in`, `value-out→value-in`
- [ ] 자기 자신 연결 차단
- [ ] `valueType` 일치 검사 (number↔number, asset↔asset 등)
- [ ] 단일 슬롯 점유 여부 (이미 edge 있는 target port 거부)
- [ ] cycle 생성 여부 검사

### 5-2. `findBestSnapTarget` 구현

- [ ] `canConnect` 통과한 후보만 필터링
- [ ] 거리 기반 최적 후보 1개 선택 (threshold 기본 40px)
- [ ] threshold 초과 시 null 반환

### 5-3. `applySnap` 구현

- [ ] source anchor → target anchor offset 계산
- [ ] 블록 좌표 보정 (연결선이 아니라 블록이 딱 붙음)

### 5-4. Statement 체인 삽입

- [ ] A→B 체인 중간에 X 드롭 → A→X→B 자동 재연결
- [ ] pointer y 기준 삽입 인덱스 계산
- [ ] 삽입 위치 horizontal insertion bar 표시

### 5-5. C-block Child Slot 삽입

- [ ] 드래그 블록이 cavity bounds 진입 감지
- [ ] `insertIntoChildSlot` 호출
- [ ] 삽입 위치 indicator 표시

### 5-6. 드래그 이벤트

- [ ] `pointerdown` — draggingBlockId 저장, 초기 anchor 계산
- [ ] `pointermove` — rAF throttle, 후보 탐색, highlight 갱신
- [ ] `pointerup` — 최종 snap 판정, edge/child 삽입, anchor 갱신

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

### 6-1. 문법 검증 (Layer 1: Shape)

- [ ] Hat 블록이 strategy root인지 확인
- [ ] Hat 블록의 `prev` 포트에 연결 없음
- [ ] Boolean 블록이 condition slot 외 단독 배치 감지
- [ ] Value 블록이 statement stack에 직접 배치 감지
- [ ] C-block 내부에 Hat 블록 없음

### 6-2. 타입 검증 (Layer 2: Data Contract)

- [ ] number slot에 non-number value 연결 감지
- [ ] asset slot에 non-asset value 연결 감지
- [ ] signal slot에 non-signal value 연결 감지
- [ ] boolean slot에 non-boolean 연결 감지
- [ ] `required: true` 포트가 미연결인 블록 감지

### 6-3. 의미 검증 (Layer 3: Semantics)

- [ ] `resume_strategy`가 `pause_strategy` 없이 단독 사용 → 경고
- [ ] `kill_switch` 이후에 실행 블록 연결 → 경고
- [ ] 전략에 아무 신호 출력 없음 (`emit_signal` 부재) → 경고

### 6-4. 검증 결과 표시

- [ ] 에러 블록 빨간 outline
- [ ] 경고 블록 노란 outline
- [ ] 에러 메시지 tooltip 또는 패널 표시
- [ ] 에러 없는 상태 → "실행 가능" 표시

### 6-5. 검증 케이스

- [ ] 정상 전략 (`every_interval → if → buy_market`) → 에러 없음
- [ ] Hat 없는 전략 → "시작 블록 없음" 에러
- [ ] `if` 조건 비어있는 전략 → "필수 입력 누락" 에러
- [ ] Boolean 블록 statement stack 단독 배치 → 문법 에러
- [ ] `value(asset)` → `number` slot 연결 → 타입 에러
- [ ] `resume_strategy` 단독 사용 → 의미 경고

---

## Phase 7. 컴파일러

### 7-1. `compile(doc): CompiledGraph`

- [ ] Trigger root 탐색 (Hat 블록)
- [ ] statement chain → CompiledNode 체인 구성
- [ ] boolean expression graph 재귀 탐색
- [ ] value expression graph 재귀 탐색
- [ ] C-block child slot → `CompiledNode.children` 변환
- [ ] orphan 블록 (미연결) → compiled graph에서 제외

### 7-2. 검증

- [ ] `every_interval → if(compare(price_of, >, ma_of)) → buy_market` → 올바른 CompiledNode 트리
- [ ] statement chain `A → B → C` → 순서 보존 확인
- [ ] `if_else` → `then` / `else` 두 child 배열 모두 존재
- [ ] cycle 있는 document 컴파일 → 에러 발생
- [ ] 검증 실패 document 컴파일 → 컴파일 거부

---

## Phase 8. 런타임 실행

### 8-1. Expression Evaluator

- [ ] `evaluateValue(node, ctx)` — `price_of`, `rsi_of`, `ma_of`, `change_pct_of`, `volume_of`
- [ ] `evaluateValue` — `sentiment_of`, `position_info`, `portfolio_info`

### 8-2. Predicate Evaluator

- [ ] `evaluateBoolean(node, ctx)` — `compare`, `between`, `and`, `or`, `not`, `keyword_match`

### 8-3. Statement Executor

- [ ] `executeStatement(node, ctx)` — `if`, `if_else`
- [ ] `buy_market`, `sell_market`, `close_position`
- [ ] `emit_signal` — signal bus 발행
- [ ] `pause_strategy`, `resume_strategy`
- [ ] `set_stop_loss`, `set_take_profit`, `max_position_size`
- [ ] `cooldown_after_loss`, `kill_switch`

### 8-4. Trigger 스케줄러

- [ ] `every_interval` — interval 기반 스케줄러
- [ ] `when_signal_received` — signal bus 구독
- [ ] `when_news_arrives` — 뉴스 이벤트 구독
- [ ] 발화 시 `RuntimeContext` 생성

### 8-5. 검증

- [ ] `every_interval → buy_market(BTC, 100)` mock → broker.buy 호출 확인
- [ ] `if(compare(price_of, >, 50000)) → buy_market` — price=60000 → 실행됨
- [ ] `if(compare(price_of, >, 50000)) → buy_market` — price=40000 → 미실행
- [ ] `if_else` — 각 분기 올바르게 실행
- [ ] `and(true, false)` → false, 하위 실행 안 됨
- [ ] `emit_signal(ENTRY)` → signal bus ENTRY 발행
- [ ] `when_signal_received(ENTRY) → buy_market` — ENTRY 수신 → 실행됨
- [ ] `kill_switch` 실행 → 이후 블록 미실행
- [ ] `pause_strategy` 후 trigger 발화 → 실행 무시

---

## Phase 9. 직렬화 / 저장

- [ ] `StrategyDocument` → JSON 직렬화
- [ ] JSON → `StrategyDocument` 복원
- [ ] 복원 후 블록 위치, edge, children 동일
- [ ] 복원 document → 컴파일 → 실행 성공
- [ ] DB 저장 → 로드 → UI 재구성

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
- [ ] 스냅으로 연결 완성
- [ ] 검증 통과 (에러 없음)
- [ ] 컴파일 성공
- [ ] mock 실행 — price>MA, RSI<70 → emit_signal 호출
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
