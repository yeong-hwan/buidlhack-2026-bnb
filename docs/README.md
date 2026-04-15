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

## 동기화 원칙

- 타입/필드/블록 목록이 바뀌면 먼저 `web/src/blocks/data.ts`, `registry.ts`, `document.ts`, `runtime.ts`를 기준으로 확인한다.
- 문서 예시는 구현과 다를 경우 문서를 수정한다. 구현 의도를 바꿀 때만 문서보다 코드를 우선 수정하지 않는다.
