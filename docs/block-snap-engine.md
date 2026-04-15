# Block Snap Engine

스크래치식 스냅 시스템 설계 문서.
단순 drag-and-drop이 아니라 **typed ports + snap anchors + structured insertion engine**이다.

---

## 핵심 원칙

스크래치식 스냅은 "좌표가 가까우면 붙는" 게 아니다.

```ts
// 스냅 판정의 본질
canConnect(sourcePort, targetPort) && distance(sourceAnchor, targetAnchor) < threshold
```

- 블록마다 **포트 anchor**가 있다
- 드래그 중 **가까운 후보 포트/슬롯**을 찾는다
- `canConnect()`로 **문법/타입**을 검사한다
- 유효하면 **좌표를 보정해서 딱 붙인다**
- statement는 **체인 삽입**
- C-block은 **child slot 편입**
- 연결은 객체 참조가 아니라 **document state 갱신**으로 처리한다

---

## Port Anchor

연결 단위는 **블록 전체**가 아니라 **포트**다.

```ts
type PortRole =
  | 'statement-in'
  | 'statement-out'
  | 'boolean-in'
  | 'boolean-out'
  | 'value-in'
  | 'value-out'
  | 'child-slot';

interface PortAnchor {
  blockId: string;
  portName: string;
  role: PortRole;
  x: number;       // 화면 절대 좌표
  y: number;
  width: number;
  height: number;
}
```

각 포트의 anchor는 실제 DOM 렌더 위치와 일치해야 한다.

---

## 포트 종류별 스냅 방식

### A. Statement 스냅 — 퍼즐형 세로 연결

```
예: buy_market.next → sell_market.prev
```

- y축 중심으로 판정
- 연결 후 세로 stack 재배치
- 중간 삽입 지원 (linked list 방식)

### B. Boolean 스냅 — 슬롯 내부 embed

```
예: compare.result → if.condition
```

- target slot의 bounds 내부 진입 여부로 판정
- boolean 타입 일치 필요
- 연결 후 부모 블록 내부에 inline embed

### C. Value 스냅 — 타입별 필드 삽입

```
예: price_of.value → compare.left
```

- number / asset / signal / text 등 valueType 일치 필요
- 연결 후 부모 블록 내부 레이아웃 재계산

### D. Child Slot 스냅 — C-block 내부 삽입

```
예: buy_market을 if.then 내부로 드래그
```

- 드래그 블록이 statement 계열인지 확인
- `if.then` cavity 영역 안으로 진입했는지 확인
- 삽입 인덱스 계산
- `children.then` 배열에 편입

---

## 핵심 함수

### `canConnect` — 문법/타입 검증

```ts
function canConnect(source: PortAnchor, target: PortAnchor): boolean {
  if (source.blockId === target.blockId) return false;

  const compatibleRoles: Record<string, string[]> = {
    'statement-out': ['statement-in'],
    'boolean-out':   ['boolean-in'],
    'value-out':     ['value-in'],
  };

  return compatibleRoles[source.role]?.includes(target.role) ?? false;
}
```

타입까지 포함한 확장 버전:

```ts
function canConnectByType(source: PortSpec, target: PortSpec): boolean {
  if (source.kind === 'value' && target.kind === 'value') {
    return source.valueType === target.valueType; // number-number, asset-asset 등
  }
  if (source.kind === 'boolean' && target.kind === 'boolean') return true;
  if (source.kind === 'statement' && target.kind === 'statement') return true;
  return false;
}
```

### `findBestSnapTarget` — 최적 후보 탐색

```ts
function findBestSnapTarget(
  draggedPort: PortAnchor,
  candidates: PortAnchor[],
  threshold: number,
): PortAnchor | null {
  let best: PortAnchor | null = null;
  let bestDistance = Infinity;

  for (const candidate of candidates) {
    if (!canConnect(draggedPort, candidate)) continue;

    const dx = draggedPort.x - candidate.x;
    const dy = draggedPort.y - candidate.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < threshold && distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }

  return best;
}
```

### `applySnap` — 좌표 보정

```ts
// 스크래치 느낌의 핵심: 연결선만 생기는 게 아니라 블록이 딱 붙는다
function applySnap(
  draggedBlock: BlockNode,
  sourcePort: PortAnchor,
  targetPort: PortAnchor,
): BlockNode {
  const offsetX = targetPort.x - sourcePort.x;
  const offsetY = targetPort.y - sourcePort.y;

  return {
    ...draggedBlock,
    x: draggedBlock.x + offsetX,
    y: draggedBlock.y + offsetY,
  };
}
```

---

## Statement 체인 삽입

statement 연결은 edge가 아니라 **linked list 중간 삽입**처럼 처리한다.

```
기존: A → B
X를 A와 B 사이에 드롭하면:
결과: A → X → B
```

내부 처리:
- `A.next → X.prev`
- `X.next → B.prev`

삽입 위치 계산:

```ts
interface StatementChainInsertResult {
  previousId: string | null;
  nextId: string | null;
  insertIndex: number;
}
```

드래그 중 pointer y좌표를 기준으로 어느 gap에 넣을지 계산한다.

---

## C-block Child Slot 삽입

```ts
function insertIntoChildSlot(
  parent: BlockNode,
  slotName: string,
  childBlockId: string,
  index: number,
): BlockNode {
  const current = parent.children?.[slotName] ?? [];
  const next = [...current];
  next.splice(index, 0, childBlockId);

  return {
    ...parent,
    children: {
      ...(parent.children ?? {}),
      [slotName]: next,
    },
  };
}
```

BlockNode의 children 구조:

```ts
interface BlockNode {
  id: string;
  type: string;
  data: BlockData;
  children?: Record<string, string[]>; // { then: ['buy1', 'emit1'] }
}
```

---

## 드래그 4단계 처리

### 1) 드래그 시작 (`pointerdown`)
- 드래그 블록 id 저장
- source anchor 목록 계산
- 현재 bounding box 측정

### 2) 드래그 중 (`pointermove`)
- 드래그 블록 위치 갱신 (DOM → 캔버스 좌표 변환)
- 주변 후보 anchor 검색
- `canConnect()` 검사
- 최적 후보 1개 선택
- ghost highlight 표시

### 3) 드롭 직전
- 유효한 후보 있으면 → edge 생성 또는 child 삽입 + 좌표 스냅 보정
- 유효한 후보 없으면 → 원위치 복귀 또는 자유 배치

### 4) 드롭 후 (`pointerup`)
- 전체 레이아웃 재정렬
- 검증 다시 실행
- 연결선/중첩 구조 다시 그림

---

## 시각적 피드백 (필수)

스냅의 절반은 판정이 아니라 피드백이다.

| 상황 | 피드백 |
|------|--------|
| 드래그 중 — 붙을 수 있는 슬롯 | 강조 (glow) |
| 드래그 중 — 현재 최적 후보 슬롯 | 강한 outline |
| 드래그 중 — 안 맞는 슬롯 | 비활성 처리 |
| statement 삽입 위치 | horizontal insertion bar |
| boolean/value slot 진입 | slot outline 강조 |
| C-block child slot 진입 | cavity 배경 강조 |

피드백 없으면 사용자는 왜 안 붙는지 알 수 없다.

---

## Editor State

```ts
interface EditorState {
  blocks: Record<string, BlockNode>;
  edges: Edge[];
  draggingBlockId: string | null;
  hoverSnapTarget: {
    blockId: string;
    portName: string;
  } | null;
}
```

---

## 성능 고려

블록이 많아지면 매 `mousemove`마다 전체 포트 검색은 느려진다.

| 최적화 | 설명 |
|--------|------|
| Spatial index | rbush 등으로 근접 포트만 검색 |
| rAF throttle | `requestAnimationFrame` 단위로만 계산 |
| Candidate pruning | 화면 viewport 내 포트만 대상 |

초기에는 단순 거리 계산으로 시작하고, 블록 수가 늘면 spatial index 추가한다.

---

## 구현 우선순위

| 단계 | 내용 | 난이도 |
|------|------|--------|
| 1 | Statement stack 스냅 — 세로 퍼즐형 + 체인 삽입 | 중 |
| 2 | Boolean/value slot 스냅 — inline embed | 중 |
| 3 | C-block child slot 스냅 — cavity 삽입 | 상 |
| 4 | 복합 재배치 — 부모 크기 자동 확장, 전체 레이아웃 갱신 | 상 |

처음부터 전부 만들면 어렵다. 1 → 2 → 3 순서로 단계적으로 구현한다.

---

## 요약

```
스냅 = canConnect() + distance() + applySnap()

포트 종류     → 스냅 방식
statement     → 세로 체인 삽입 (linked list)
boolean       → slot 내부 inline embed
value         → typed field slot embed
child         → C-block cavity 배열 삽입

연결은 document state 갱신으로 처리
UI는 state에서 파생된 뷰
```
