export type Coordinate = {
  x: number;
  y: number;
};

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
    nodeIds: string[];
    nodeById: Record<string, NodeRect>;
  };
  ui: {
    selectedIds: string[];
    isDragging: boolean;
    dragActiveId: string | null;
    dragStartPointer: Coordinate | null;
    dragStartSnapshotById: Record<string, Coordinate>;
    layerQuery: string;
    isRenderLoggingEnabled: boolean;
    debugTick: number;
    debugChecksum: number;
  };
};
