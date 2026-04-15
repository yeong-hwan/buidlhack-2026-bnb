# Docs Index

현재 `docs/`는 블록 시스템 설계와 구현 계획을 정리한 문서 모음이다.
최신 구현 기준의 source of truth는 `web/src/blocks/*`, `web/src/store/*`이며, 문서는 그 구현을 설명하도록 유지한다.

## 권장 읽기 순서

1. `block-catalog.md` — 블록 목록, shape, 카테고리
2. `block-design.md` — 포트/타입/실행 의미 분리 원칙
3. `block-architecture.md` — `StrategyDocument`, `CompiledNode`, SignalBus 규칙
4. `block-snap-engine.md` — 편집기 스냅/삽입 동작
5. `block-todo.md` — 구현 체크리스트
6. `block-test-plan.md` — 수동 검증 시나리오

## 현재 구현 기준 메모

- 등록 블록 수: 34개
- Hat 블록: `every_interval`, `when_signal_received`, `when_news_arrives`, `manual_run`
- `StrategyDocument.blocks`는 배열이 아니라 `Record<string, BlockNode>`
- `BlockNode.data`는 `Record<string, unknown>`가 아니라 블록별 정적 타입 유니온
- signal 흐름은 document edge가 아니라 런타임 `SignalBus`에서 `signalType`으로 연결

## Phase 4 현재 상태

- 현재 에디터는 "shape preview + canvas navigation" 수준까지 구현된 상태로 본다.
- `zoom` / `pan`은 `EditorState`에 정의돼 있지만 실제 캔버스와 팔레트는 아직 별도 로컬 state를 사용한다.
- `BlockRenderer`는 shape와 label 위주로 렌더하며, `node.data` 기반 field 표시와 inline 편집은 아직 없다.
- layout 엔진은 shape별 기본 크기와 anchor는 계산하지만, field 수와 실제 field 위치를 충분히 반영하는 field-aware layout 단계까지는 가지 않았다.
- `if_else`, `consensus`처럼 child slot이 여러 개인 블록은 cavity 자체는 계산하지만 slot label, divider, 의미 구분 UI는 아직 부족하다.
- statement stack interaction은 아직 Scratch 감각과 다르다.
  현재는 "클릭한 블록을 루트로 한 하위 체인"만 같이 이동하는 경향이 있어, 연결된 스택 전체가 한 덩어리로 들리는 느낌이 약하다.
  드래그 시작 시 부모 edge를 즉시 끊는 동작도 Scratch식 픽업/분리 감각과 다르다.

## 다음 우선순위

1. 캔버스와 팔레트가 동일한 `zoom` / `pan` source of truth를 사용하도록 정리
2. `BlockLayout`을 field-aware하게 확장해서 field 표시/편집과 snap이 같은 좌표계를 공유하도록 정리
3. `BlockRenderer`에 read-only field 표시를 먼저 넣고, 그 다음 inline edit 연결
4. 다중 child slot 블록(`if_else`, `consensus`)에 slot label / divider / insertion UI 추가
5. statement stack을 "어디를 잡아도 연결된 스택 전체가 함께 이동"하는 모델로 정리
6. 드래그 시작 시 즉시 detach하지 않고, 실제 분리 의도가 확정되는 시점에 detach 처리

## 동기화 원칙

- 타입/필드/블록 목록이 바뀌면 먼저 `web/src/blocks/data.ts`, `registry.ts`, `document.ts`, `runtime.ts`를 기준으로 확인한다.
- 문서 예시는 구현과 다를 경우 문서를 수정한다. 구현 의도를 바꿀 때만 문서보다 코드를 우선 수정하지 않는다.
