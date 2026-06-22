import { create } from "zustand";
import type { EditorState, NodeRect } from "./types";
import { clamp, createNodes } from "./utils";

const DEFAULT_COUNT = 7000;

function createInitialState(nodeCount: number): EditorState {
  const nodes = createNodes(nodeCount);
  return {
    doc: { nodes },
    ui: {
      selectedIds: [nodes[0]?.id ?? "node_0"],
      isDragging: false,
      dragActiveId: null,
      dragStartPointer: null,
      dragStartSnapshotById: {},
      layerQuery: "",
      isRenderLoggingEnabled: false,
      debugTick: 0,
      debugChecksum: 0,
    },
  };
}

export type EditorStore = EditorState & {
  nodeCount: number;
  setNodeCount: (n: number) => void;
  reset: (n: number) => void;
  toggleRenderLogging: (v: boolean) => void;
  setLayerQuery: (q: string) => void;
  selectOnly: (id: string) => void;
  clearSelection: () => void;
  selectAndStartDrag: (
    id: string,
    pointer: { x: number; y: number },
    shift: boolean
  ) => void;
  moveDragBy: (dx: number, dy: number) => void;
  endDrag: () => void;
  patchSelected: (patch: Partial<NodeRect>) => void;
};

export const useEditorStore = create<EditorStore>((set) => ({
  ...createInitialState(DEFAULT_COUNT),
  nodeCount: DEFAULT_COUNT,

  setNodeCount: (n) => set({ nodeCount: clamp(n, 100, 20000) }),

  reset: (n) =>
    set(() => ({
      ...createInitialState(n),
      nodeCount: n,
    })),

  toggleRenderLogging: (v) =>
    set((s) => ({ ui: { ...s.ui, isRenderLoggingEnabled: v } })),

  setLayerQuery: (q) =>
    set((s) => ({ ui: { ...s.ui, layerQuery: q } })),

  selectOnly: (id) =>
    set((s) => ({ ui: { ...s.ui, selectedIds: [id] } })),

  clearSelection: () =>
    set((s) => ({
      ui: {
        ...s.ui,
        selectedIds: [],
        isDragging: false,
        dragActiveId: null,
        dragStartPointer: null,
        dragStartSnapshotById: {},
        debugTick: s.ui.debugTick + 1,
      },
    })),

  selectAndStartDrag: (id, pointer, shift) =>
    set((s) => {
      const nextSelectedIds = shift
        ? Array.from(new Set([...s.ui.selectedIds, id]))
        : [id];
      const snapshot: Record<string, { x: number; y: number }> = {};
      for (const sid of nextSelectedIds) {
        const n = s.doc.nodes.find((node) => node.id === sid);
        if (n) snapshot[sid] = { x: n.x, y: n.y };
      }
      return {
        ui: {
          ...s.ui,
          selectedIds: nextSelectedIds,
          isDragging: true,
          dragActiveId: id,
          dragStartPointer: pointer,
          dragStartSnapshotById: snapshot,
          debugTick: s.ui.debugTick + 1,
        },
      };
    }),

  moveDragBy: (dx, dy) =>
    set((s) => {
      let checksum = 0;
      for (let i = 0; i < s.doc.nodes.length; i += 1) {
        checksum =
          (checksum +
            ((s.doc.nodes[i].x * 31 + s.doc.nodes[i].y * 17) | 0)) |
          0;
      }
      const nextNodes = s.doc.nodes.map((n) => {
        if (!s.ui.selectedIds.includes(n.id)) return n;
        const start = s.ui.dragStartSnapshotById[n.id];
        if (!start) return n;
        return { ...n, x: start.x + dx, y: start.y + dy };
      });
      return {
        doc: { ...s.doc, nodes: nextNodes },
        ui: {
          ...s.ui,
          debugTick: s.ui.debugTick + 1,
          debugChecksum: checksum,
        },
      };
    }),

  endDrag: () =>
    set((s) => ({
      ui: {
        ...s.ui,
        isDragging: false,
        dragActiveId: null,
        dragStartPointer: null,
        dragStartSnapshotById: {},
        debugTick: s.ui.debugTick + 1,
      },
    })),

  patchSelected: (patch) =>
    set((s) => {
      const id = s.ui.selectedIds[0];
      if (!id) return s;
      return {
        doc: {
          ...s.doc,
          nodes: s.doc.nodes.map((n) =>
            n.id === id ? { ...n, ...patch } : n
          ),
        },
      };
    }),
}));
