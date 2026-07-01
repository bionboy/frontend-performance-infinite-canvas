# Performance Prior Art

This document summarizes how similar canvas, diagramming, and design-tool systems have solved latency problems like the ones in this project. The common theme is that high-frequency interactions should avoid updating broad application state and avoid re-rendering the full scene.

## Sources Reviewed

| Source | Relevant idea |
| --- | --- |
| React Flow performance docs | Node movement causes frequent state updates; avoid subscribing components to the full `nodes` array; store selected ids separately; memoize custom nodes and handlers. |
| Konva performance docs | During drag, move the dragged shape to a dedicated drag layer so only that layer redraws, then move it back on drag end. |
| tldraw performance docs | Use viewport culling, reactive signals, batched store updates, geometry caching, and granular shape-level reactivity so one shape update does not re-render the whole canvas. |
| tldraw store/signals docs | Store records by id, batch transactions, use indexed queries, and subscribe components to the exact records/signals they read. |
| Figma engineering blog | Professional web design tools often bypass DOM/SVG for hot rendering paths; Figma built a WebGL renderer and tile-based engine for predictable performance. |
| PixiJS performance docs | Keep scene objects cheap, reduce event traversal, batch where possible, and avoid constantly modifying expensive graphics. |
| React docs | Drawing editors are a case where memoization and local state matter; transient state should not be lifted globally unless necessary. |
| MDN / web.dev animation guidance | Use `requestAnimationFrame` for animation-frame-aligned updates; animate with `transform` instead of layout-affecting properties where possible. |

## Pattern 1: Dedicated Drag Layer / Overlay

Konva gives the closest match to our proposed overlay fix. Its docs explicitly recommend optimizing dragging by moving the dragged shape to a dedicated layer during drag, then moving it back on drag end. The reason is simple: while dragging, redrawing the original layer is expensive because that layer contains many shapes.

Applied to this project, the DOM equivalent is a `DragOverlay`:

1. Leave the 7,000 committed nodes stable.
2. Hide or ghost the active node in the main canvas.
3. Render the active node in an overlay above the canvas.
4. Move the overlay with `transform: translate(...)`.
5. Commit final `x/y` to the store once on pointer up.

This pattern is the strongest support for doing the local overlay fix before normalizing state. It changes the per-frame unit of work from the whole scene to the active dragged node.

## Pattern 2: Do Not Subscribe UI To The Whole Nodes Array

React Flow calls out a common pitfall: components that read the full `nodes` array re-render whenever nodes change, even when the component only needs selected node ids or some derived subset. Their recommended solution is to store selected node ids separately and subscribe to those directly.

This maps directly to our code:

1. `App`, `Canvas`, `LayersPanel`, and `PropertiesPanel` call `useEditorStore()` without selectors.
2. Drag updates rewrite `doc.nodes`.
3. Any component reading the whole store is notified.
4. The Properties panel would update every drag frame if enabled.

The prior-art fix is selector-driven subscriptions. Components should subscribe to stable, narrow slices:

```ts
const selectedIds = useEditorStore((s) => s.ui.selectedIds)
const nodeCount = useEditorStore((s) => s.nodeCount)
```

This supports normalization indirectly, but it is not the same as normalization. Even with `nodesById`, broad subscriptions still cause broad re-renders.

## Pattern 3: Granular Reactive Records

tldraw uses a reactive store and signals. Its docs say that when a shape's props change, only that shape's component re-renders, not the entire canvas. It also keeps records in a store, supports indexed queries, and batches transactions.

This is the strongest prior-art support for normalized or record-based state. A mature editor benefits from:

1. Shape records keyed by id.
2. Ordered ids or indexes for drawing order.
3. Query indexes for parent/selection/layer lookups.
4. Batched transactions for multi-shape updates.
5. Computed caches for geometry and bounds.

But tldraw pairs this with granular reactivity. Normalization alone is not enough. The key is that consumers subscribe at record granularity instead of reading the full scene.

## Pattern 4: Viewport Culling And Level Of Detail

tldraw also avoids rendering what the user cannot see. It uses viewport culling so a page with thousands of shapes may render only the visible subset. It also simplifies rendering at low zoom levels and debounces zoom-dependent calculations.

This project currently renders every node regardless of viewport visibility. That is acceptable for a small exercise, but it is not how production infinite-canvas editors scale.

Potential follow-up after drag is smooth:

1. Only render nodes intersecting the viewport.
2. Overscan slightly to avoid pop-in.
3. Simplify shapes when zoomed out.
4. Keep hit testing/indexing separate from DOM rendering.

This is lower priority than the drag overlay because the acceptance target is smooth drag at 7,000 nodes, not arbitrary million-node navigation.

## Pattern 5: Batch Durable State Updates

tldraw batches store updates and exposes transactions. The principle is that observers should see one coherent change, not a stream of redundant intermediate updates.

For this project, drag should produce:

1. Transient visual updates during movement.
2. One durable document transaction at the end.

That is better than writing each pointer delta into document state. It also makes undo/redo cleaner: one drag should be one history entry, not dozens of coordinate patches.

## Pattern 6: Avoid DOM/SVG As The Final Scaling Strategy

Figma's engineering write-up is an extreme version of the same lesson. They found HTML/SVG/2D canvas insufficient for a professional design tool and built a WebGL, tile-based renderer. They specifically call out DOM access, repeated tessellation, inconsistent GPU acceleration, and immediate-mode canvas costs.

We should not jump to WebGL for this exercise. But the lesson matters: large design tools do not rely on the browser reconciling thousands of arbitrary DOM nodes for every interaction. They minimize the hot rendering surface, cache aggressively, and keep tight control over the render loop.

## Pattern 7: Use The Browser's Animation Fast Path

MDN and web.dev both reinforce using `requestAnimationFrame` for animation-frame-aligned visual updates. web.dev recommends high-performance animation properties like `transform` and `opacity` because they avoid layout-heavy work.

For this project:

1. Pointer events may arrive faster than paint frames.
2. Drag movement should coalesce to one visual update per frame.
3. The overlay should move with `transform`, not by repeatedly changing `left` and `top`.

## What This Means For Our Trade-Off

| Question | Prior-art answer |
| --- | --- |
| Should we render the dragged node locally with an overlay? | Yes. Konva's drag-layer guidance is almost exactly this pattern. It directly reduces per-frame work. |
| Should we normalize node state? | Eventually, probably. tldraw's record store supports this direction, but only with granular subscriptions/indexes. |
| Is normalization the primary latency fix? | No. React Flow's docs show the real issue is broad subscription to changing nodes; normalized data can still re-render everything if consumed broadly. |
| Should Properties update during drag? | No. React Flow/tldraw patterns both support separating selected ids, transient interaction state, and committed document state. |
| Should drag write to document state every frame? | No. Prior art favors transient interaction updates plus batched durable commits. |

## Recommended Approach For This Project

1. Implement drag overlay first.
2. Keep `doc.nodes` stable during drag.
3. Commit final position once on pointer up.
4. Add Zustand selectors so panels and topbar do not subscribe to the whole store.
5. Memoize or isolate `Shape` rendering so unchanged nodes do not re-render.
6. Consider normalized `nodesById` plus `nodeIds` after the drag hot path is fixed.
7. Consider viewport culling if the exercise expands beyond the current 7,000-node drag target.

## Source Links

- React Flow performance: https://reactflow.dev/learn/advanced-use/performance
- Konva performance tips: https://konvajs.org/docs/performance/All_Performance_Tips.html
- tldraw performance: https://tldraw.dev/sdk-features/performance
- tldraw store: https://tldraw.dev/sdk-features/store
- tldraw signals: https://tldraw.dev/sdk-features/signals
- Figma engineering: https://www.figma.com/blog/building-a-professional-design-tool-on-the-web/
- PixiJS performance tips: https://pixijs.com/8.x/guides/concepts/performance-tips
- React memo docs: https://react.dev/reference/react/memo
- MDN requestAnimationFrame: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
- web.dev animation guide: https://web.dev/articles/animations-guide
