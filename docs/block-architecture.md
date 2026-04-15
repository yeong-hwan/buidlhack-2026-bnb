# Block Architecture

블록 시스템의 내부 연결 구조 및 실행 아키텍처.

---

## 핵심 원칙

**블록 인스턴스끼리 직접 참조하지 않는다.**

```ts
// ❌ 이렇게 하면 안 됨
ifBlock.condition = compareBlock;
compareBlock.left = priceBlock;
```

직접 참조 방식의 문제:
- undo/redo 어려움
- 직렬화 어려움
- 복사/붙여넣기 어려움
- 순환 참조 관리 어려움
- UI 상태와 엔진 상태가 강하게 결합됨

**대신: node + edge + child-slot 방식으로 저장한다.**

---

## 4단계 처리 모델

```
1. UI 편집 상태      — 사용자가 블록을 배치/연결
2. 그래프/AST 변환   — document state로 저장
3. 검증/컴파일       — 타입·문법·의미 검사 후 실행 그래프 생성
4. 런타임 실행       — 실행 그래프를 순서대로 평가/실행
```

각 단계는 독립적이다. UI 편집 중 상태가 미완성이어도 런타임에 영향을 주지 않는다.

---

## 두 가지 핵심 데이터 구조

### 1. Document Graph — 편집/저장용

사용자가 만든 전략의 원본 설계도.

```ts
interface StrategyDocument {
  blocks: Record<string, BlockNode>;
  edges: Edge[];
}
```

DB 저장, undo/redo, export/import, 협업의 대상이다.

#### BlockNode

```ts
type BlockId = string;

interface BlockNode {
  id: BlockId;
  type: BlockType;                    // 'if', 'buy_market', 'compare' 등
  data: BlockData;                    // 블록별 정적 타입 data
  x: number;                          // world 좌표
  y: number;
  children?: Record<string, string[]>; // C-block 전용 child slot
}
```

예:
```ts
const blocks: Record<string, BlockNode> = {
  b1: { id: 'b1', type: 'every_interval', data: { interval: 1, unit: 'h' }, x: 100, y: 100 },
  b2: { id: 'b2', type: 'if', data: {}, children: { then: ['b4'] }, x: 100, y: 180 },
  b3: { id: 'b3', type: 'compare', data: { operator: '>' }, x: 300, y: 180 },
  b4: { id: 'b4', type: 'buy_market', data: { asset: 'BTC', amount: 100 }, x: 100, y: 320 },
};
```

#### Edge

```ts
interface Edge {
  id: string;
  from: { blockId: string; port: string };
  to:   { blockId: string; port: string };
}
```

예:
```ts
const edges: Edge[] = [
  { id: 'e1', from: { blockId: 'b1', port: 'next'      }, to: { blockId: 'b2', port: 'prev'      } },
  { id: 'e2', from: { blockId: 'b3', port: 'result'    }, to: { blockId: 'b2', port: 'condition' } },
  { id: 'e3', from: { blockId: 'b5', port: 'value'     }, to: { blockId: 'b3', port: 'left'      } },
  { id: 'e4', from: { blockId: 'b6', port: 'value'     }, to: { blockId: 'b3', port: 'right'     } },
];
```

---

### 2. Compiled Graph — 실행용

document를 검증·컴파일한 후 만들어지는 실행 계획. 런타임 전용.

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

---

## C-block 연결 처리

`if`, `if_else`, `consensus` 같은 C-block은 일반 edge와 child-slot을 분리해서 저장한다.

| 연결 종류 | 저장 방식 |
|---------|---------|
| 조건 연결 (`condition`) | edge |
| 상위/하위 statement 연결 (`prev`, `next`) | edge |
| 내부 자식 블록 연결 (`then`, `else`, `signals`) | `BlockNode.children` |

```ts
// if 블록 예시
{
  id: 'if1',
  type: 'if',
  data: {},
  children: {
    then: ['buy1', 'emit1'],  // 순서가 중요
  }
}
```

이 구조가 Scratch 계열 블록에 가장 자연스럽게 맞는다.

---

## 포트 연결 종류

연결 종류에 따라 의미가 다르다.

| port_kind | 예 | 의미 |
|----------|-----|------|
| `statement` | `every_interval.next → if.prev` | 실행 흐름 순서 |
| `boolean` | `compare.result → if.condition` | 조건식 제공 |
| `value` | `price_of.value → compare.left` | 계산값 공급 |
| `signal` | `emit_signal(ENTRY)` / `when_signal_received(ENTRY)` | document edge가 아니라 SignalBus 매칭으로 연결 |
| `child` | `buy_market ∈ if.then` | 부모-자식 소속 |

---

## UI 편집 시 연결 처리 흐름

사용자가 `compare.result`를 `if.condition`에 드래그한다고 할 때:

```
1. 드래그 중 — 소스 포트의 kind/valueType 확인
               화면 내 호환 가능한 target port 후보 강조

2. 연결 검증 — canConnect(source, target) 실행
               ① kind 일치 여부
               ② valueType 일치 여부
               ③ target port가 이미 점유됐는지 (단일 슬롯)
               ④ 자기 자신 연결 여부
               ⑤ cycle 생성 여부

3. edge 생성 — 검증 통과 시 document state에 edge 추가
               { from: { blockId: 'compare1', port: 'result' },
                 to:   { blockId: 'if1',      port: 'condition' } }

4. UI 재렌더 — 연결선 렌더링, 블록 스냅, warning/error 갱신
```

---

`emit_signal`과 `when_signal_received` 사이에는 별도 edge를 만들지 않는다.
둘은 `signalType`이 일치할 때 런타임 SignalBus에서만 연결된다.

---

## 블록 클래스가 사용되는 시점

블록 클래스 인스턴스는 세 곳에서만 쓰인다. 런타임에서 직접 연결하는 데는 쓰이지 않는다.

| 시점 | 역할 |
|------|------|
| 블록 생성 | 팔레트에서 드래그 시 registry에서 클래스 조회 → 기본값 추출 → BlockNode 생성 |
| 연결 검증 | `getSpec()`으로 포트 정의 확인 → 호환성 검사 |
| 컴파일 | BlockSpec 기반으로 document graph → compiled graph 변환 |

```ts
// 블록 생성 예시
const instance = new BLOCK_REGISTRY['buy_market']();
const node: BlockNode = {
  id: uuid(),
  type: instance.type,
  data: { asset: instance.asset, amount: instance.amount },
  x: dropX,
  y: dropY,
};
```

---

## 런타임 실행 흐름

document를 컴파일한 후 런타임은 대략 이 순서로 실행한다.

```ts
async function runTrigger(root: CompiledTriggerNode, ctx: RuntimeContext) {
  await executeStatement(root.next, ctx);
}

async function executeStatement(node: CompiledStatementNode, ctx: RuntimeContext) {
  switch (node.type) {
    case 'if': {
      const condition = await evaluateBoolean(node.condition, ctx);
      if (condition) {
        for (const child of node.children.then) {
          await executeStatement(child, ctx);
        }
      }
      if (node.next) await executeStatement(node.next, ctx);
      break;
    }
    case 'buy_market': {
      await broker.buy(node.asset, node.amount, ctx);
      if (node.next) await executeStatement(node.next, ctx);
      break;
    }
  }
}
```

---

## 4계층 아키텍처

| 계층 | 역할 | 데이터 |
|------|------|--------|
| **편집기** | React state / Zustand | `StrategyDocument` |
| **검증기** | BlockSpec 기반 포트 타입·cycle·필수 입력 검사 | — |
| **컴파일러** | document → compiled graph | `CompiledNode` 트리 |
| **런타임** | trigger scheduler, evaluator, executor, state store | 실행 결과 |

---

## 분리 이유

document와 compiled graph를 분리하는 이유:

| 문제 | 설명 |
|------|------|
| UI 중간 상태 | 드래그 중인 연결은 미완성. 런타임 구조와 동일하면 중간 상태 처리가 복잡해짐 |
| 불완전한 문서 | amount 비어 있음, if 조건 없음, orphan block 있음 — 런타임은 불완전하면 안 됨 |
| 컴파일 최적화 | dead node 제거, constant folding, cycle 검사 등은 document 그대로 할 수 없음 |

---

## 요약

```
블록 클래스    — 스키마 정의 (BlockSpec, getSpec)
BlockNode     — 화면의 블록 인스턴스 데이터 (id + type + data + children)
Edge          — 포트 간 연결 (from.blockId:port → to.blockId:port)
StrategyDoc   — 편집 상태의 source of truth
CompiledGraph — 런타임 실행 계획 (kind + inputs + children + next)

UI 편집 → document 저장 → 검증 → 컴파일 → 런타임 실행
```
