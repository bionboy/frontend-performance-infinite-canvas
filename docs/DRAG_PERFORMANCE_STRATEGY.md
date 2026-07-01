# Drag Performance Strategy

This document compares the trade-off between two possible approaches for the main latency problem: rendering the active drag node locally with an overlay versus changing the state structure to normalize the nodes array.

## The Trade-Off

| Option | Strategy | Best for | Main risk |
| --- | --- | --- | --- |
| A | Render the active drag node locally with an overlay, then commit once on drag end. | Smooth drag quickly. Directly satisfies the acceptance criteria. | Requires careful visual/state split during drag. |
| B | Normalize the node state from an array into id-indexed structures. | Faster lookup/update paths across the app. Better long-term data model. | Does not by itself stop full canvas re-renders during drag. |

## Option A: Local Drag Overlay

The core idea is to stop writing every pointer movement into `doc.nodes`. During drag, store transient pointer delta locally or in isolated drag state. Render the dragged node separately in an overlay using `transform`. On pointer up, commit the final coordinates to the real document once.

Current behavior:

1. Pointer moves.
2. `store.moveDragBy(dx, dy)` runs.
3. Entire `doc.nodes` array is mapped.
4. Store update notifies broad subscribers.
5. `Canvas` re-renders.
6. Thousands of `Shape` components reconcile.
7. `PropertiesPanel`, if enabled, also sees every coordinate update.

Target behavior:

1. Pointer moves.
2. Local drag delta updates, preferably throttled by `requestAnimationFrame`.
3. Only the overlay node visually moves.
4. The main document remains stable during drag.
5. On pointer up, commit one final document update.

Benefits:

1. Directly addresses the worst hot path.
2. Keeps `doc.nodes` stable during drag, so panels do not update every frame.
3. Reduces React work from thousands of nodes per frame to one moving node.
4. Allows `transform: translate(...)`, which is better for motion than changing `left`/`top`.
5. Smaller change than a full state-shape migration.

Tradeoffs:

1. The dragged node exists in two conceptual places during drag: its committed document position and its transient visual position.
2. Selection outlines, hit testing, and multi-select need clear rules while dragging.
3. If the original node stays visible under the overlay, it may need to be hidden or rendered as a placeholder during drag.

Suggested shape:

```tsx
// During drag
<Shape node={committedNode} isHidden={isActiveDragNode} />
<DragOverlay node={committedNode} dx={dragDx} dy={dragDy} />

// On drag end
patchSelected({ x: committedNode.x + dragDx, y: committedNode.y + dragDy })
```

For multi-select, the overlay can render the selected nodes only. The important constraint is that the full document array should not be rewritten for every frame.

## Option B: Normalize Node State

The core idea is to replace `doc.nodes: NodeRect[]` as the primary state with id-indexed data.

Possible shape:

```ts
type DocumentState = {
  nodeIds: string[];
  nodesById: Record<string, NodeRect>;
};
```

Benefits:

1. `selectAndStartDrag` can get nodes by id without repeated `find` calls.
2. `patchSelected` can update one node without mapping the full array.
3. `PropertiesPanel` can read the selected node directly by id.
4. `LayersPanel` can still preserve ordering through `nodeIds`.
5. It creates a better foundation for larger editor behavior.

Tradeoffs:

1. It does not automatically fix broad subscriptions.
2. It does not automatically stop `Canvas` from rendering all nodes if `Canvas` still subscribes to the whole store.
3. Updating `nodesById` still creates a new object, and broad subscribers still re-render.
4. Rendering still needs `nodeIds.map(...)`, so the React tree can remain the bottleneck.
5. It is a wider migration than Option A because every component expects `doc.nodes` today.

Normalization is useful, but it solves lookup and update complexity more than frame-time rendering. If the app still commits every pointer move to global document state, normalized state may improve CPU cost but still miss the smooth-drag target.

## Recommended Sequencing: Overlay First, Normalize Second

This is the recommended way to resolve the trade-off.

Step 1: Implement the local drag overlay.

1. Keep document coordinates stable during active drag.
2. Render only selected/dragged nodes in an overlay while dragging.
3. Commit final coordinates once in `endDrag`.
4. Ensure the Properties panel only reflects the final committed position.

Step 2: Narrow subscriptions.

1. `App` should not subscribe to the full store.
2. `Canvas` should not consume all UI/document state if only some fields are needed.
3. Panels should subscribe to selected slices only.

Step 3: Normalize only if profiling still shows lookup/update cost.

1. Add `nodesById` and `nodeIds` when direct node lookup becomes valuable.
2. Keep selectors stable so individual consumers do not re-render unnecessarily.
3. Avoid a large state rewrite before the primary drag hot path is fixed.

## Recommendation

Do not start with normalization as the main performance fix. It is a good structural improvement, but the current latency is dominated by per-frame global document updates and full React reconciliation.

Start with Option A. It most directly changes the runtime shape from "7,000 nodes update every frame" to "one overlay updates every frame, document commits once." Then add selectors. Normalize afterward only if profiling shows remaining state lookup/update costs or if upcoming features need id-based document operations.

## Decision Summary

| Question | Answer |
| --- | --- |
| Which option best satisfies smooth drag at 7,000 nodes? | Option A. |
| Which option best improves the data model? | Option B. |
| Which option should be done first? | Option A. |
| Should normalization be skipped forever? | No. Defer it until after the drag path is fixed and measured. |
| Best final architecture? | Overlay drag plus selective normalized state where useful. |
