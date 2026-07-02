export type NodeRect = {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
};

export type EditorState = {
  doc: {
    // nodes: NodeRect[];
    nodeIds: string[];
    nodeById: Record<string, NodeRect>;
  };
  ui: {
    selectedIds: string[];
    isDragging: boolean;
    dragActiveId: string | null;
    dragStartPointer: { x: number; y: number } | null;
    dragStartSnapshotById: Record<string, { x: number; y: number }>;
    layerQuery: string;
    isRenderLoggingEnabled: boolean;
    debugTick: number;
    debugChecksum: number;
  };
};
