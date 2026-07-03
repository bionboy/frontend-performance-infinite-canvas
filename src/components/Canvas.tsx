import { useCallback, useMemo, useRef } from "react";
import { useEditorStore } from "../store";
import { useRenderCount } from "../useRenderCount";
import { Shape } from "./Shape";
import { MatrixOverlay } from "./MatrixOverlay";
import { Coordinate } from "../types";

function getPointerPositionWithin(el: HTMLElement, e: React.PointerEvent): Coordinate {
  const rect = el.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

export function Canvas() {
  const isRenderLoggingEnabled = useEditorStore((state) => state.ui.isRenderLoggingEnabled);
  const isDragging = useEditorStore((state) => state.ui.isDragging);
  const dragStartPointer = useEditorStore((state) => state.ui.dragStartPointer);
  const nodeIds = useEditorStore((state) => state.doc.nodeIds);
  const selectedIds = useEditorStore((state) => state.ui.selectedIds);
  const clearSelection = useEditorStore((state) => state.clearSelection);
  const moveDragBy = useEditorStore((state) => state.moveDragBy);
  const endDrag = useEditorStore((state) => state.endDrag);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  useRenderCount("Canvas", isRenderLoggingEnabled);

  const viewportRef = useRef<HTMLDivElement | null>(null);

  const dragDeltaRef = useRef<Coordinate>();

  function handlePointerDownOnCanvas(e: React.PointerEvent<HTMLDivElement>): void {
    if (e.target === e.currentTarget) {
      clearSelection();
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>): void {
    if (!isDragging) return;
    if (!dragStartPointer) return;
    const viewport = viewportRef.current;
    if (!viewport) return;

    const pointer = getPointerPositionWithin(viewport, e);
    const delta = { x: pointer.x - dragStartPointer.x, y: pointer.y - dragStartPointer.y };

    dragDeltaRef.current = delta;
    // moveDragBy(delta);
  }

  function handlePointerUp(): void {
    endDrag();
  }

  const handleSelectAndStartDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, nodeId: string): void => {
      e.preventDefault();
      e.stopPropagation();

      const viewport = viewportRef.current;
      if (!viewport) return;

      const pointer = getPointerPositionWithin(viewport, e);
      useEditorStore.getState().selectAndStartDrag(nodeId, pointer, e.shiftKey);
      viewport.setPointerCapture(e.pointerId);
    },
    [],
  );

  const isNodeSelected = useCallback(
    (nodeId: string): boolean => {
      return selectedSet.has(nodeId);
    },
    [selectedSet],
  );

  return (
    <div className="canvas-wrap">
      <div
        ref={viewportRef}
        className="canvas-viewport"
        onPointerDown={handlePointerDownOnCanvas}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div className="canvas-page">
          {nodeIds.map((id) => (
            <Shape
              key={id}
              nodeId={id}
              isSelected={isNodeSelected(id)}
              isRenderLoggingEnabled={isRenderLoggingEnabled}
              onPointerDown={handleSelectAndStartDrag}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
