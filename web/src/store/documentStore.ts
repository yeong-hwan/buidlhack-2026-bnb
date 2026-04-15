/**
 * Document State — Zustand store.
 *
 * StrategyDocument의 모든 편집 액션을 관리한다.
 * 각 액션은 immer-style로 불변 업데이트.
 *
 * undo/redo: MVP 범위 제외. 구조만 준비.
 */
import { create } from 'zustand';
import type { BlockNode, Edge, StrategyDocument, ValidationError } from '../blocks/document';
import type { BlockData, BlockType } from '../blocks/data';
import { createBlockNode } from '../blocks/registry';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DocumentState {
  document: StrategyDocument;
  zoom: number;
  pan: { x: number; y: number };
  draggingBlockId: string | null;
  hoverSnapTarget: { blockId: string; portName: string } | null;
  validationErrors: ValidationError[];

  // Actions
  addBlock(node: BlockNode): void;
  addBlockByType(type: BlockType, x: number, y: number): BlockNode;
  removeBlock(id: string): void;
  updateBlockData(id: string, data: Partial<BlockData>): void;
  updateBlockPosition(id: string, x: number, y: number): void;

  addEdge(edge: Edge): void;
  removeEdge(id: string): void;

  insertIntoChildSlot(parentId: string, slotName: string, childId: string, index: number): void;
  removeFromChildSlot(parentId: string, slotName: string, childId: string): void;

  setZoom(zoom: number): void;
  setPan(x: number, y: number): void;
  setDraggingBlockId(id: string | null): void;
  setHoverSnapTarget(target: { blockId: string; portName: string } | null): void;
  setValidationErrors(errors: ValidationError[]): void;

  reset(): void;
}

// ── Initial State ─────────────────────────────────────────────────────────────

const INITIAL_DOCUMENT: StrategyDocument = {
  blocks: {},
  edges: [],
};

// ── Store ─────────────────────────────────────────────────────────────────────

export const useDocumentStore = create<DocumentState>((set, get) => ({
  document: INITIAL_DOCUMENT,
  zoom: 1,
  pan: { x: 0, y: 0 },
  draggingBlockId: null,
  hoverSnapTarget: null,
  validationErrors: [],

  // ── Block Actions ───────────────────────────────────────────────────────────

  addBlock(node) {
    set((state) => ({
      document: {
        ...state.document,
        blocks: { ...state.document.blocks, [node.id]: node },
      },
    }));
  },

  addBlockByType(type, x, y) {
    const node = createBlockNode(type, x, y);
    get().addBlock(node);
    return node;
  },

  removeBlock(id) {
    set((state) => {
      const blocks = { ...state.document.blocks };
      delete blocks[id];

      // id와 연결된 edge 제거
      const edges = state.document.edges.filter(
        (e) => e.from.blockId !== id && e.to.blockId !== id,
      );

      // 모든 C-block의 children에서 id 제거
      // discriminated union 스프레드 시 TypeScript 추론 한계 → StrategyDocument로 명시
      const nextBlocks: Record<string, BlockNode> = {};
      for (const [bid, block] of Object.entries(blocks)) {
        if (!block.children) {
          nextBlocks[bid] = block;
          continue;
        }
        const children: Record<string, string[]> = {};
        for (const [slot, ids] of Object.entries(block.children)) {
          children[slot] = ids.filter((cid) => cid !== id);
        }
        nextBlocks[bid] = { ...block, children } as BlockNode;
      }
      const nextDocument: StrategyDocument = { blocks: nextBlocks, edges };
      return { document: nextDocument };
    });
  },

  updateBlockData(id, data) {
    set((state) => {
      const block = state.document.blocks[id];
      if (!block) return state;
      return {
        document: {
          ...state.document,
          blocks: {
            ...state.document.blocks,
            [id]: { ...block, data: { ...block.data, ...data } as BlockData },
          },
        },
      };
    });
  },

  updateBlockPosition(id, x, y) {
    set((state) => {
      const block = state.document.blocks[id];
      if (!block) return state;
      return {
        document: {
          ...state.document,
          blocks: {
            ...state.document.blocks,
            [id]: { ...block, x, y },
          },
        },
      };
    });
  },

  // ── Edge Actions ────────────────────────────────────────────────────────────

  addEdge(edge) {
    set((state) => ({
      document: {
        ...state.document,
        edges: [...state.document.edges, edge],
      },
    }));
  },

  removeEdge(id) {
    set((state) => ({
      document: {
        ...state.document,
        edges: state.document.edges.filter((e) => e.id !== id),
      },
    }));
  },

  // ── Child Slot Actions ──────────────────────────────────────────────────────

  insertIntoChildSlot(parentId, slotName, childId, index) {
    set((state) => {
      const parent = state.document.blocks[parentId];
      if (!parent?.children) return state;

      const current = parent.children[slotName] ?? [];
      const next = [...current];
      next.splice(index, 0, childId);

      return {
        document: {
          ...state.document,
          blocks: {
            ...state.document.blocks,
            [parentId]: {
              ...parent,
              children: { ...parent.children, [slotName]: next },
            },
          },
        },
      };
    });
  },

  removeFromChildSlot(parentId, slotName, childId) {
    set((state) => {
      const parent = state.document.blocks[parentId];
      if (!parent?.children) return state;

      const next = (parent.children[slotName] ?? []).filter((id) => id !== childId);

      return {
        document: {
          ...state.document,
          blocks: {
            ...state.document.blocks,
            [parentId]: {
              ...parent,
              children: { ...parent.children, [slotName]: next },
            },
          },
        },
      };
    });
  },

  // ── Editor State Actions ────────────────────────────────────────────────────

  setZoom(zoom) {
    set({ zoom });
  },

  setPan(x, y) {
    set({ pan: { x, y } });
  },

  setDraggingBlockId(id) {
    set({ draggingBlockId: id });
  },

  setHoverSnapTarget(target) {
    set({ hoverSnapTarget: target });
  },

  setValidationErrors(errors) {
    set({ validationErrors: errors });
  },

  reset() {
    set({
      document: { blocks: {}, edges: [] },
      zoom: 1,
      pan: { x: 0, y: 0 },
      draggingBlockId: null,
      hoverSnapTarget: null,
      validationErrors: [],
    });
  },
}));

// ── Selectors ─────────────────────────────────────────────────────────────────

export const selectBlock = (id: string) => (state: DocumentState) =>
  state.document.blocks[id];

export const selectAllBlocks = (state: DocumentState) =>
  Object.values(state.document.blocks);

export const selectEdges = (state: DocumentState) => state.document.edges;

export const selectDocument = (state: DocumentState) => state.document;
