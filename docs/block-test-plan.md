# Block System — Phase별 시각화 & 수동 테스트 계획

각 Phase는 아래 두 조건을 동시에 만족해야 완성이다.

1. **눈으로 상태를 확인할 수 있어야 한다**
2. **손으로 실패 케이스를 재현할 수 있어야 한다**

이 두 조건이 없으면 해당 Phase는 완성이 아니다.

---

## Phase 0 — 데이터 모델

### 시각화

- [ ] JSON 뷰어 패널 — `blocks`, `edges`, `children` 실시간 표시
- [ ] 블록 클릭 시 해당 `BlockNode.data` 상세 표시

### 수동 테스트

- [ ] 블록 생성 → JSON에 `blocks[id]` 반영 확인
- [ ] C-block에 child 삽입 → `children.then` 배열 순서 확인
- [ ] 블록 삭제 → 관련 edge, parent `children` 배열에서도 제거 확인
- [ ] JSON export → import → 동일 구조 복원 (`blocks`, `edges`, `children` 모두)

---

## Phase 1 — 블록 레지스트리

### 시각화

- [ ] 좌측 팔레트 — 34개 블록 카테고리별 목록
- [ ] 드래그 시 ghost 블록 (semi-transparent)

### 수동 테스트

- [ ] 모든 34개 블록 drag 가능
- [ ] drop 시 기본값 확인
  - `every_interval` → `interval=1`, `unit='h'`
  - `buy_market` → `asset=''`, `amount=0`
  - `compare` → `operator='>'`
- [ ] 존재하지 않는 type 생성 시도 → 명확한 에러 발생

---

## Phase 2 — Document State

### 시각화

- [ ] Dev panel — undo stack 깊이 / redo stack 깊이 표시
- [ ] 현재 선택 블록 highlight

### 수동 테스트

- [ ] `addBlock → undo → redo` → 상태 정확히 복원
- [ ] `removeBlock` → edge, parent `children` 동시 제거 확인
- [ ] C-block child 삽입 순서 유지 확인
- [ ] 여러 블록 이동 후 undo → 각 이동 역순 복원

---

## Phase 3 — Layout Engine

### 시각화 (debug overlay, 토글 가능)

- [ ] block bounding box (파란 테두리)
- [ ] port anchor 점 (작은 색상 점으로 표시)
  - statement-in/out → 회색
  - boolean-in/out → 파란색
  - value-in/out → 녹색
- [ ] C-block cavity 영역 (배경 하이라이트)
- [ ] child insertion points (가로 점선)

### 수동 테스트

- [ ] zoom in/out 후 anchor 점 위치가 블록과 일치 (world 좌표 검증)
- [ ] pan 이동 후 anchor 점 위치 일치
- [ ] C-block에 child 1개 추가 → height 자동 증가 확인
- [ ] C-block에 child 2개 추가 → height 추가 증가
- [ ] nested C-block (if 안에 if) → 내부 확장이 외부까지 전파
- [ ] boolean 블록 condition slot anchor 위치 정확성
- [ ] value capsule anchor 위치 정확성
- [ ] screen → world → screen 좌표 round-trip 오차 0 확인

---

## Phase 4 — Shape Rendering

### 시각화

- [ ] 5종 shape 시각적으로 구분 가능
  - Hat: 상단 라운드, 하단 notch 돌기
  - Stack: 상단 홈 + 하단 돌기
  - Boolean: hexagon
  - Value: pill capsule
  - C-block: header + cavity + footer

### 수동 테스트

- [ ] Hat: 상단에 연결 포인트 없음 (statement-in anchor 없음)
- [ ] Stack: 상하 notch 정렬 — 위에 Stack 붙이면 틈 없이 맞닿음
- [ ] Boolean hexagon 형태 확인 (직사각형 아님)
- [ ] Value capsule 형태 확인 (직사각형 아님)
- [ ] C-block: header/cavity/footer 3구역 명확히 구분
- [ ] cavity 비어있을 때 placeholder 높이 확인
- [ ] field 수정 → `updateBlockData` 호출 → JSON 패널에 반영

---

## Phase 5 — Snap Engine

### 시각화 (drag 중)

- [ ] 호환 슬롯 glow (연결 가능 표시)
- [ ] 비호환 슬롯 dim (연결 불가 표시)
- [ ] statement 삽입 위치 horizontal insertion bar
- [ ] C-block cavity 진입 시 배경 강조
- [ ] drop 시 블록이 "딱 붙는" 위치 보정 (애니메이션)

### 수동 테스트

#### Statement 체인

- [ ] A 아래 B 붙이기 → edge `A.next → B.prev` 생성
- [ ] A→B 체인 중간에 X 드롭 → A→X→B 재연결

#### Boolean 연결

- [ ] `compare.result → if.condition` 연결 성공
- [ ] `compare.result → compare.left` (boolean → value slot) 연결 실패

#### Value 연결

- [ ] `price_of.value → compare.left` (number→number) 성공
- [ ] `price_of.value → buy_market.asset` (number→asset) 실패

#### Child-Slot

- [ ] `buy_market` → `if` cavity 드롭 → `if.children.then` 편입 확인
- [ ] `buy_market` → cavity 밖 드롭 → 편입 안 됨

#### 연결 제약

- [ ] 자기 자신의 port에 연결 → 차단
- [ ] A→B, B→A cycle 시도 → 차단
- [ ] Hat 블록 상단(statement-in 없음)에 연결 → 차단
- [ ] drop 실패 시 블록 원위치 복귀

---

## Phase 6 — Validator

### 시각화

- [ ] 에러 블록 — 빨간 outline
- [ ] 경고 블록 — 노란 outline
- [ ] 블록 hover 시 메시지 tooltip 또는 side panel
- [ ] 에러 없는 상태 → "실행 가능" 배지 표시

### 수동 테스트

#### Shape (문법)

- [ ] Hat 블록 없는 전략 → "시작 블록 없음" 에러
- [ ] Boolean 블록 단독 배치 (condition slot 외) → 문법 에러

#### Type (데이터 계약)

- [ ] number slot에 asset 타입 연결 → 타입 에러
- [ ] `required: true` port 미연결 → "필수 입력 누락" 에러
- [ ] `buy_market.asset` 비어있음 → 에러
- [ ] `buy_market.amount=0` → 에러 (0은 유효하지 않은 금액)

#### Semantics (의미)

- [ ] `resume_strategy`만 단독 배치 → warning
- [ ] `emit_signal` 없는 전략 → warning
- [ ] `if_else.then`, `if_else.else` 둘 다 비어있음 → warning
- [ ] `set_stop_loss`, `set_take_profit` 없는 실행 전략 → warning

---

## Phase 7 — Compiler

### 시각화

- [ ] CompiledGraph viewer (tree 형태)
  - trigger root 목록
  - 각 node의 `kind` 표시 (`trigger` / `statement` / `expression` / `predicate`)
- [ ] 블록 hover 시 해당 CompiledNode 매핑 강조

### 수동 테스트

- [ ] `every_interval → buy_market` → 선형 chain 구조 확인
- [ ] `if → [buy_market, emit_signal]` → `children.then` 트리 확인
- [ ] `if_else` → `then` / `else` 두 branch 분리 확인
- [ ] orphan 블록 → CompiledGraph에 없음 확인
- [ ] validation 에러 있는 상태 → compile 버튼 비활성 또는 에러 반환

---

## Phase 8 — Runtime

### 시각화

- [ ] execution log panel — `timestamp | block type | result`
- [ ] signal bus panel — emit된 signal 목록 (type, source, strength)
- [ ] context inspector — `prices`, `positions`, `portfolio` 현재값

### 수동 테스트

#### Expression

- [ ] `price_of(BNB)` → mock price 반환 확인

#### Predicate

- [ ] `compare(price_of, >, 50000)` — price=60000 → true
- [ ] `compare(price_of, >, 50000)` — price=40000 → false

#### Statement

- [ ] `buy_market(BTC, 100)` → mock broker.buy 호출 확인 (log에 표시)
- [ ] `if(true) → buy_market` → 실행
- [ ] `if(false) → buy_market` → 미실행

#### Signal

- [ ] `emit_signal(ENTRY, 100)` → signal bus에 ENTRY 발행
- [ ] `when_signal_received(ENTRY) → buy_market` → ENTRY 수신 시 실행

#### Control

- [ ] `kill_switch` 실행 → 이후 블록 미실행 + `strategyState.killed=true`
- [ ] `pause_strategy` 후 trigger 재발화 → 실행 무시
- [ ] `resume_strategy` 후 trigger 재발화 → 실행 재개

---

## Phase 9 — 직렬화

### 시각화

- [ ] "Export JSON" 버튼 → 파일 다운로드
- [ ] "Import JSON" 버튼 → 파일 업로드

### 수동 테스트

- [ ] 전략 저장 → 페이지 reload → 동일 UI 복원
- [ ] nested C-block 구조 유지 (children 배열 순서 포함)
- [ ] edge 연결 유지
- [ ] zoom/pan 값 복원

---

## E2E 시나리오

### 시각화 (optional)

- [ ] 실행 중인 active path highlight
- [ ] 실행 흐름 애니메이션

### 시나리오 A — 조건 기반 진입

```
every_interval(1h)
  if and(
    compare(price_of(BNB), >, ma_of(BNB, 20)),
    compare(rsi_of(BNB, 14), <, 70)
  )
    emit_signal(ENTRY, 80)
```

- [ ] 조건 만족 (price>MA, RSI<70) → `emit_signal` 실행 + log에 ENTRY 표시
- [ ] 조건 불만족 → `emit_signal` 미실행

### 시나리오 B — 리스크 방어

```
when_signal_received(ENTRY)
  max_position_size(20%)
  set_stop_loss(10%)
  set_take_profit(20%)
```

- [ ] ENTRY 수신 → 3개 action 순서대로 실행 (log 순서 확인)

### 시나리오 C — 드로우다운 방어

```
every_interval(1h)
  if compare(portfolio_info(drawdown), >, 15)
    pause_strategy
    close_position(all)
```

- [ ] drawdown=20 → `pause_strategy` + `close_position` 실행
- [ ] drawdown=10 → 미실행
