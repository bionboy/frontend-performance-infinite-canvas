# Overlay Drag Layer Example

This document shows what the first performance fix would look like without applying it. The goal is to make drag smooth by rendering the active drag node in a small overlay instead of rewriting and re-rendering all 7,000 document nodes on every pointer move.

## Core Idea

Before:

1. Pointer moves.
2. `Canvas` calls `store.moveDragBy(dx, dy)`.
3. `moveDragBy` maps over every node and writes new `doc.nodes`.
4. The full canvas re-renders.
5. The selected shape visually moves because its committed `x/y` changed.

After:

1. Pointer moves.
2. `Canvas` updates local transient drag delta.
3. The committed `doc.nodes` array stays unchanged during drag.
4. A `DragOverlay` renders only the active selected node with `transform`.
5. On pointer up, one store action commits the final `x/y`.

## 1. Store: Stop Rewriting Nodes During Move

Current hot path in `src/store.ts`:

```ts
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
```

After, the store does not need `moveDragBy` for every frame. It only needs a final commit action:

```ts
commitDragBy: (dx, dy) =>
  set((s) => {
    const selectedIds = new Set(s.ui.selectedIds);

    return {
      doc: {
        ...s.doc,
        nodes: s.doc.nodes.map((n) => {
          if (!selectedIds.has(n.id)) return n;
          const start = s.ui.dragStartSnapshotById[n.id];
          if (!start) return n;
          return { ...n, x: start.x + dx, y: start.y + dy };
        }),
      },
      ui: {
        ...s.ui,
        isDragging: false,
        dragActiveId: null,
        dragStartPointer: null,
        dragStartSnapshotById: {},
      },
    };
  }),
```

Notes:

1. This still maps the array, but only once at drag end.
2. This preserves the current array-based document shape.
3. This keeps Properties panel updates aligned with the acceptance criteria: it sees final committed coordinates, not every transient frame.

## 2. Canvas: Move Drag Delta To Local State

Current `src/components/Canvas.tsx` pointer move:

```ts
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
```

After, `Canvas` keeps transient drag delta locally:

```ts
const [dragDelta, setDragDelta] = useState<{ dx: number; dy: number } | null>(
  null
);

function handlePointerMove(e: React.PointerEvent<HTMLDivElement>): void {
  if (!store.ui.isDragging) return;
  if (!store.ui.dragStartPointer) return;
  const viewport = viewportRef.current;
  if (!viewport) return;

  const pointer = getPointerPositionWithin(viewport, e);
  setDragDelta({
    dx: pointer.x - store.ui.dragStartPointer.x,
    dy: pointer.y - store.ui.dragStartPointer.y,
  });
}
```

This is the simplest version. A more polished version would coalesce pointer events with `requestAnimationFrame` so React gets at most one visual update per paint frame.

## 3. Canvas: Commit Once On Pointer Up

Current pointer up:

```ts
function handlePointerUp(): void {
  store.endDrag();
}
```

After, pointer up commits the final delta:

```ts
function handlePointerUp(): void {
  if (dragDelta) {
    store.commitDragBy(dragDelta.dx, dragDelta.dy);
    setDragDelta(null);
    return;
  }

  store.endDrag();
}
```

The store should still keep an `endDrag` fallback for cancelled drags or pointer-up without movement.

## 4. Canvas: Hide The Original Active Node

Current node render:

```tsx
{store.doc.nodes.map((node) => (
  <Shape
    key={node.id}
    node={node}
    isSelected={store.ui.selectedIds.includes(node.id)}
    isRenderLoggingEnabled={store.ui.isRenderLoggingEnabled}
    onPointerDown={(e) => handleSelectAndStartDrag(e, node.id)}
  />
))}
```

After, the committed node stays in place but can be hidden while the overlay renders the moving version:

```tsx
{store.doc.nodes.map((node) => {
  const isSelected = store.ui.selectedIds.includes(node.id);
  const isDraggingSelectedNode = store.ui.isDragging && isSelected;

  return (
    <Shape
      key={node.id}
      node={node}
      isSelected={isSelected}
      isHidden={isDraggingSelectedNode}
      isRenderLoggingEnabled={store.ui.isRenderLoggingEnabled}
      onPointerDown={(e) => handleSelectAndStartDrag(e, node.id)}
    />
  );
})}

{store.ui.isDragging && dragDelta ? (
  <DragOverlay
    nodes={store.doc.nodes}
    selectedIds={store.ui.selectedIds}
    dragDelta={dragDelta}
  />
) : null}
```

This still maps all nodes when `Canvas` re-renders. The big win is that `doc.nodes` no longer changes every pointer frame. The next optimization would be narrowing subscriptions and memoizing shapes so only the overlay updates during drag.

## 5. Shape: Add A Hidden State

Current `ShapeProps`:

```ts
export interface ShapeProps {
  node: NodeRect;
  isSelected: boolean;
  isRenderLoggingEnabled: boolean;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
}
```

After:

```ts
export interface ShapeProps {
  node: NodeRect;
  isSelected: boolean;
  isHidden?: boolean;
  isRenderLoggingEnabled: boolean;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
}
```

Current style:

```tsx
style={{
  position: "absolute",
  left: props.node.x,
  top: props.node.y,
  width: props.node.w,
  height: props.node.h,
  background: props.node.fill,
  outline: props.isSelected ? "2px solid #111" : "1px solid rgba(0,0,0,0.12)",
  borderRadius: 2,
  userSelect: "none",
  touchAction: "none",
}}
```

After:

```tsx
style={{
  position: "absolute",
  left: props.node.x,
  top: props.node.y,
  width: props.node.w,
  height: props.node.h,
  background: props.node.fill,
  outline: props.isSelected ? "2px solid #111" : "1px solid rgba(0,0,0,0.12)",
  borderRadius: 2,
  userSelect: "none",
  touchAction: "none",
  visibility: props.isHidden ? "hidden" : "visible",
}}
```

`visibility: hidden` keeps layout irrelevant because these nodes are absolutely positioned. `display: none` would also work here, but `visibility` makes the visual placeholder choice explicit.

## 6. New DragOverlay Component

New file: `src/components/DragOverlay.tsx`

```tsx
import type { NodeRect } from "../types";

export function DragOverlay(props: {
  nodes: NodeRect[];
  selectedIds: string[];
  dragDelta: { dx: number; dy: number };
}) {
  const selectedIds = new Set(props.selectedIds);
  const draggedNodes = props.nodes.filter((node) => selectedIds.has(node.id));

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
      }}
    >
      {draggedNodes.map((node) => (
        <div
          key={node.id}
          style={{
            position: "absolute",
            left: node.x,
            top: node.y,
            width: node.w,
            height: node.h,
            background: node.fill,
            outline: "2px solid #111",
            borderRadius: 2,
            transform: `translate(${props.dragDelta.dx}px, ${props.dragDelta.dy}px)`,
            willChange: "transform",
          }}
        />
      ))}
    </div>
  );
}
```

Why this works:

1. The overlay only renders selected dragged nodes.
2. `pointerEvents: "none"` keeps input handling on the canvas viewport.
3. `transform` moves the node without changing document coordinates.
4. `willChange` is scoped to the tiny active drag surface, not all 7,000 shapes.

## 7. Better Version: requestAnimationFrame Coalescing

The simple version calls `setDragDelta` for every pointer move. A smoother version stores the latest delta in a ref and commits it once per animation frame.

```ts
const latestDragDeltaRef = useRef<{ dx: number; dy: number } | null>(null);
const frameRef = useRef<number | null>(null);
const [dragDelta, setDragDelta] = useState<{ dx: number; dy: number } | null>(
  null
);

function scheduleDragDelta(delta: { dx: number; dy: number }) {
  latestDragDeltaRef.current = delta;

  if (frameRef.current !== null) return;

  frameRef.current = requestAnimationFrame(() => {
    frameRef.current = null;
    setDragDelta(latestDragDeltaRef.current);
  });
}
```

Then `handlePointerMove` calls `scheduleDragDelta(...)` instead of `setDragDelta(...)` directly.

Cleanup on unmount or drag end:

```ts
if (frameRef.current !== null) {
  cancelAnimationFrame(frameRef.current);
  frameRef.current = null;
}
```

## 8. Expected Impact

Before:

```txt
pointermove -> map 7,000 nodes -> update global store -> render Canvas -> reconcile 7,000 Shapes
```

After:

```txt
pointermove -> update local drag delta -> render DragOverlay for selected node(s)
pointerup -> commit one document update
```

The overlay fix should be the first implementation step because it directly attacks the highest-cost behavior: committed document updates on every frame.

## 9. What This Does Not Solve Yet

This fix does not fully solve every performance issue by itself.

Remaining follow-ups:

1. Use Zustand selectors instead of `useEditorStore()` everywhere.
2. Memoize `Shape` or move each shape to a narrow per-node subscription.
3. Remove `expensiveDerivedWork` from render.
4. Normalize nodes only if lookup/update cost remains meaningful after the drag path is fixed.
5. Virtualize/cull nodes if viewport rendering remains expensive.
