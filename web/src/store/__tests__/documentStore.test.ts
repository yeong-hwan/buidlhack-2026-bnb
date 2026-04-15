import { describe, it, expect, beforeEach } from 'vitest';
import { useDocumentStore } from '../documentStore';
import type { Edge } from '../../blocks/document';

// Zustand store를 테스트 간 초기화
beforeEach(() => {
  useDocumentStore.getState().reset();
});

describe('addBlock / addBlockByType', () => {
  it('addBlockByType → store에 블록 추가', () => {
    const node = useDocumentStore.getState().addBlockByType('every_interval', 100, 200);
    const blocks = useDocumentStore.getState().document.blocks;
    expect(blocks[node.id]).toBeDefined();
    expect(blocks[node.id].type).toBe('every_interval');
    expect(blocks[node.id].x).toBe(100);
    expect(blocks[node.id].y).toBe(200);
  });

  it('every_interval 기본값 확인', () => {
    const node = useDocumentStore.getState().addBlockByType('every_interval', 0, 0);
    const block = useDocumentStore.getState().document.blocks[node.id];
    expect((block.data as { interval: number }).interval).toBe(1);
    expect((block.data as { unit: string }).unit).toBe('h');
  });

  it('buy_market 기본값 확인', () => {
    const node = useDocumentStore.getState().addBlockByType('buy_market', 0, 0);
    const block = useDocumentStore.getState().document.blocks[node.id];
    expect((block.data as { asset: string }).asset).toBe('');
    expect((block.data as { amount: number }).amount).toBe(0);
  });

  it('C-block(if) children 초기화 확인', () => {
    const node = useDocumentStore.getState().addBlockByType('if', 0, 0);
    const block = useDocumentStore.getState().document.blocks[node.id];
    expect(block.children?.then).toEqual([]);
  });

  it('여러 블록 추가 → 각각 독립 id', () => {
    const a = useDocumentStore.getState().addBlockByType('buy_market', 0, 0);
    const b = useDocumentStore.getState().addBlockByType('buy_market', 100, 0);
    expect(a.id).not.toBe(b.id);
    expect(Object.keys(useDocumentStore.getState().document.blocks)).toHaveLength(2);
  });
});

describe('removeBlock', () => {
  it('블록 제거 → store에서 삭제', () => {
    const node = useDocumentStore.getState().addBlockByType('buy_market', 0, 0);
    useDocumentStore.getState().removeBlock(node.id);
    expect(useDocumentStore.getState().document.blocks[node.id]).toBeUndefined();
  });

  it('블록 제거 → 연결된 edge 함께 제거', () => {
    const a = useDocumentStore.getState().addBlockByType('every_interval', 0, 0);
    const b = useDocumentStore.getState().addBlockByType('if', 0, 0);
    const edge: Edge = {
      id: 'e1',
      from: { blockId: a.id, port: 'next' },
      to: { blockId: b.id, port: 'prev' },
    };
    useDocumentStore.getState().addEdge(edge);
    expect(useDocumentStore.getState().document.edges).toHaveLength(1);

    useDocumentStore.getState().removeBlock(a.id);
    expect(useDocumentStore.getState().document.edges).toHaveLength(0);
  });

  it('블록 제거 → 부모 C-block children에서도 제거', () => {
    const ifNode = useDocumentStore.getState().addBlockByType('if', 0, 0);
    const buyNode = useDocumentStore.getState().addBlockByType('buy_market', 0, 0);
    useDocumentStore.getState().insertIntoChildSlot(ifNode.id, 'then', buyNode.id, 0);

    expect(useDocumentStore.getState().document.blocks[ifNode.id].children?.then).toContain(buyNode.id);

    useDocumentStore.getState().removeBlock(buyNode.id);
    expect(useDocumentStore.getState().document.blocks[ifNode.id].children?.then).not.toContain(buyNode.id);
  });
});

describe('updateBlockData', () => {
  it('필드 값 변경', () => {
    const node = useDocumentStore.getState().addBlockByType('every_interval', 0, 0);
    useDocumentStore.getState().updateBlockData(node.id, { interval: 5 } as never);
    const updated = useDocumentStore.getState().document.blocks[node.id];
    expect((updated.data as { interval: number }).interval).toBe(5);
  });
});

describe('updateBlockPosition', () => {
  it('위치 변경 — world 좌표', () => {
    const node = useDocumentStore.getState().addBlockByType('buy_market', 0, 0);
    useDocumentStore.getState().updateBlockPosition(node.id, 300, 400);
    const updated = useDocumentStore.getState().document.blocks[node.id];
    expect(updated.x).toBe(300);
    expect(updated.y).toBe(400);
  });
});

describe('Edge actions', () => {
  it('addEdge → edges 배열에 추가', () => {
    const a = useDocumentStore.getState().addBlockByType('every_interval', 0, 0);
    const b = useDocumentStore.getState().addBlockByType('if', 0, 0);
    const edge: Edge = {
      id: 'e1',
      from: { blockId: a.id, port: 'next' },
      to: { blockId: b.id, port: 'prev' },
    };
    useDocumentStore.getState().addEdge(edge);
    expect(useDocumentStore.getState().document.edges).toHaveLength(1);
    expect(useDocumentStore.getState().document.edges[0].id).toBe('e1');
  });

  it('removeEdge → 해당 edge만 제거', () => {
    const edge1: Edge = { id: 'e1', from: { blockId: 'a', port: 'next' }, to: { blockId: 'b', port: 'prev' } };
    const edge2: Edge = { id: 'e2', from: { blockId: 'b', port: 'next' }, to: { blockId: 'c', port: 'prev' } };
    useDocumentStore.getState().addEdge(edge1);
    useDocumentStore.getState().addEdge(edge2);

    useDocumentStore.getState().removeEdge('e1');
    const edges = useDocumentStore.getState().document.edges;
    expect(edges).toHaveLength(1);
    expect(edges[0].id).toBe('e2');
  });
});

describe('Child Slot actions', () => {
  it('insertIntoChildSlot — if.then에 buy_market 추가', () => {
    const ifNode = useDocumentStore.getState().addBlockByType('if', 0, 0);
    const buyNode = useDocumentStore.getState().addBlockByType('buy_market', 0, 0);
    useDocumentStore.getState().insertIntoChildSlot(ifNode.id, 'then', buyNode.id, 0);
    expect(useDocumentStore.getState().document.blocks[ifNode.id].children?.then[0]).toBe(buyNode.id);
  });

  it('insertIntoChildSlot — 순서 보장', () => {
    const ifNode = useDocumentStore.getState().addBlockByType('if', 0, 0);
    const buy1 = useDocumentStore.getState().addBlockByType('buy_market', 0, 0);
    const emit1 = useDocumentStore.getState().addBlockByType('emit_signal', 0, 0);

    useDocumentStore.getState().insertIntoChildSlot(ifNode.id, 'then', buy1.id, 0);
    useDocumentStore.getState().insertIntoChildSlot(ifNode.id, 'then', emit1.id, 1);

    const then = useDocumentStore.getState().document.blocks[ifNode.id].children?.then;
    expect(then).toEqual([buy1.id, emit1.id]);
  });

  it('insertIntoChildSlot — 중간 삽입', () => {
    const ifNode = useDocumentStore.getState().addBlockByType('if', 0, 0);
    const a = useDocumentStore.getState().addBlockByType('buy_market', 0, 0);
    const b = useDocumentStore.getState().addBlockByType('emit_signal', 0, 0);
    const x = useDocumentStore.getState().addBlockByType('sell_market', 0, 0);

    useDocumentStore.getState().insertIntoChildSlot(ifNode.id, 'then', a.id, 0);
    useDocumentStore.getState().insertIntoChildSlot(ifNode.id, 'then', b.id, 1);
    // a와 b 사이에 x 삽입
    useDocumentStore.getState().insertIntoChildSlot(ifNode.id, 'then', x.id, 1);

    const then = useDocumentStore.getState().document.blocks[ifNode.id].children?.then;
    expect(then).toEqual([a.id, x.id, b.id]);
  });

  it('removeFromChildSlot — 특정 child 제거', () => {
    const ifNode = useDocumentStore.getState().addBlockByType('if', 0, 0);
    const buy1 = useDocumentStore.getState().addBlockByType('buy_market', 0, 0);
    const emit1 = useDocumentStore.getState().addBlockByType('emit_signal', 0, 0);

    useDocumentStore.getState().insertIntoChildSlot(ifNode.id, 'then', buy1.id, 0);
    useDocumentStore.getState().insertIntoChildSlot(ifNode.id, 'then', emit1.id, 1);

    useDocumentStore.getState().removeFromChildSlot(ifNode.id, 'then', buy1.id);
    const then = useDocumentStore.getState().document.blocks[ifNode.id].children?.then;
    expect(then).toEqual([emit1.id]);
  });
});

describe('JSON 직렬화 / 복원', () => {
  it('document → JSON → 복원 후 동일 구조', () => {
    const ifNode = useDocumentStore.getState().addBlockByType('if', 100, 200);
    const buyNode = useDocumentStore.getState().addBlockByType('buy_market', 100, 300);
    const edge: Edge = {
      id: 'e1',
      from: { blockId: ifNode.id, port: 'next' },
      to: { blockId: buyNode.id, port: 'prev' },
    };
    useDocumentStore.getState().addEdge(edge);
    useDocumentStore.getState().insertIntoChildSlot(ifNode.id, 'then', buyNode.id, 0);

    const doc = useDocumentStore.getState().document;
    const json = JSON.stringify(doc);
    const restored = JSON.parse(json);

    expect(restored.blocks[ifNode.id].type).toBe('if');
    expect(restored.blocks[buyNode.id].type).toBe('buy_market');
    expect(restored.edges[0].id).toBe('e1');
    expect(restored.blocks[ifNode.id].children.then).toContain(buyNode.id);
  });

  it('C-block children 배열 순서 보존', () => {
    const ifNode = useDocumentStore.getState().addBlockByType('if', 0, 0);
    const a = useDocumentStore.getState().addBlockByType('buy_market', 0, 0);
    const b = useDocumentStore.getState().addBlockByType('emit_signal', 0, 0);

    useDocumentStore.getState().insertIntoChildSlot(ifNode.id, 'then', a.id, 0);
    useDocumentStore.getState().insertIntoChildSlot(ifNode.id, 'then', b.id, 1);

    const json = JSON.stringify(useDocumentStore.getState().document);
    const restored = JSON.parse(json);
    expect(restored.blocks[ifNode.id].children.then).toEqual([a.id, b.id]);
  });
});
