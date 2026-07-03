import { useCallback, useEffect, useRef } from "react";
import { Coordinate } from "../../types";

function getNodeSelector(nodeId: string): string {
  return `[data-node-id="${CSS.escape(nodeId)}"]`;
}

export function useImperativeDragPreview() {
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
