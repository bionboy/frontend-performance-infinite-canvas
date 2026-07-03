import { useCallback, useEffect, useMemo, useRef } from "react";
import { useEditorStore } from "../store";
import { useRenderCount } from "../useRenderCount";
import { Shape } from "./Shape";
import { MatrixOverlay } from "./MatrixOverlay";
import { Coordinate } from "../types";

function getPointerPositionWithin(el: HTMLElement, e: React.PointerEvent): Coordinate {
  const rect = el.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function getNodeSelector(nodeId: string): string {
  return `[data-node-id="${CSS.escape(nodeId)}"]`;
}

function useImperativeDragPreview() {
  const selectedElementsRef = useRef<HTMLElement[]>([]);
  const dragDeltaRef = useRef<Coordinate>();
  const frameRef = useRef<number | null>(null);

  const clearDragPreview = useCallback((): void => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    for (const el of selectedElementsRef.current) {
      el.style.transform = "";
      el.style.willChange = "";
    }

    selectedElementsRef.current = [];
    dragDeltaRef.current = undefined;
  }, []);

  const startDragPreview = useCallback(
    (viewport: HTMLElement, nodeIds: string[]): void => {
      clearDragPreview();
      selectedElementsRef.current = nodeIds
        .map((id) => viewport.querySelector<HTMLElement>(getNodeSelector(id)))
        .filter((el): el is HTMLElement => el !== null);
    },
    [clearDragPreview],
  );

  const scheduleDragPreview = useCallback((delta: Coordinate): void => {
    dragDeltaRef.current = delta;

    if (frameRef.current !== null) return;

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      const latest = dragDeltaRef.current;
      if (!latest) return;

      for (const el of selectedElementsRef.current) {
        el.style.transform = `translate(${latest.x}px, ${latest.y}px)`;
        el.style.willChange = "transform";
      }
    });
  }, []);

  const getLatestDragDelta = useCallback((): Coordinate | undefined => {
    return dragDeltaRef.current;
  }, []);

  useEffect(() => clearDragPreview, [clearDragPreview]);

  return {
    clearDragPreview,
    getLatestDragDelta,
    scheduleDragPreview,
    startDragPreview,
  };
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
  const dragStartClientRef = useRef<Coordinate | null>(null);
  const { clearDragPreview, getLatestDragDelta, scheduleDragPreview, startDragPreview } =
    useImperativeDragPreview();

  function handlePointerDownOnCanvas(e: React.PointerEvent<HTMLDivElement>): void {
    if (e.target === e.currentTarget) {
      clearSelection();
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>): void {
    if (!isDragging) return;
    if (!dragStartPointer) return;
    if (!dragStartClientRef.current) return;

    const delta = {
      x: e.clientX - dragStartClientRef.current.x,
      y: e.clientY - dragStartClientRef.current.y,
    };

    scheduleDragPreview(delta);
  }

  function handlePointerUp(): void {
    if (isDragging) {
      const latest = getLatestDragDelta();
      if (latest) moveDragBy(latest);
      clearDragPreview();
      dragStartClientRef.current = null;
    }

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
      dragStartClientRef.current = { x: e.clientX, y: e.clientY };
      startDragPreview(viewport, useEditorStore.getState().ui.selectedIds);
      viewport.setPointerCapture(e.pointerId);
    },
    [startDragPreview],
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
