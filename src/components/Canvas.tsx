import { useRef } from 'react';
import { useEditorStore } from '../store';
import { expensiveDerivedWork } from '../utils';
import { useRenderCount } from '../useRenderCount';
import { Shape } from './Shape';
import { MatrixOverlay } from './MatrixOverlay';

function getPointerPositionWithin(
  el: HTMLElement,
  e: React.PointerEvent
): { x: number; y: number } {
  const rect = el.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

export function Canvas() {
  const store = useEditorStore();
  useRenderCount('Canvas', store.ui.isRenderLoggingEnabled);

  const _slow = expensiveDerivedWork(store.doc.nodes);
  void _slow;

  const viewportRef = useRef<HTMLDivElement | null>(null);

  function handlePointerDownOnCanvas(
    e: React.PointerEvent<HTMLDivElement>
  ): void {
    if (e.target === e.currentTarget) {
      store.clearSelection();
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>): void {
    if (!store.ui.isDragging) return;
    if (!store.ui.dragStartPointer) return;
    const viewport = viewportRef.current;
    if (!viewport) return;

    const pointer = getPointerPositionWithin(viewport, e);
    const dx = pointer.x - store.ui.dragStartPointer.x;
    const dy = pointer.y - store.ui.dragStartPointer.y;
    store.moveDragBy(dx, dy);
  }

  function handlePointerUp(): void {
    store.endDrag();
  }

  function handleSelectAndStartDrag(
    e: React.PointerEvent<HTMLDivElement>,
    nodeId: string
  ): void {
    e.preventDefault();
    e.stopPropagation();

    const viewport = viewportRef.current;
    if (!viewport) return;

    const pointer = getPointerPositionWithin(viewport, e);
    store.selectAndStartDrag(nodeId, pointer, e.shiftKey);
    viewport.setPointerCapture(e.pointerId);
  }

  // const matrixSeed = store.ui.debugTick;

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
          {/* <MatrixOverlay seed={matrixSeed} /> */}

          {store.doc.nodes.map((node) => (
            <Shape
              key={node.id}
              node={node}
              isSelected={store.ui.selectedIds.includes(node.id)}
              isRenderLoggingEnabled={store.ui.isRenderLoggingEnabled}
              onPointerDown={(e) => handleSelectAndStartDrag(e, node.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
