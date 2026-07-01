# Performance Audit

This project is a React/Vite canvas editor with a stated target of smooth dragging at 7,000 nodes and a Properties panel that does not update during active drag. The current UI has `LayersPanel`, `PropertiesPanel`, and `MatrixOverlay` commented out in `src/App.tsx` and `src/components/Canvas.tsx`, but they are included below because their code paths are present and the acceptance criteria explicitly references the Properties panel.

## Ranked Issues

| Rank | Impact | Issue | Evidence | Recommended fix |
| --- | --- | --- | --- | --- |
| 1 | Critical | Every pointer move updates the full document and forces a full canvas render. | `moveDragBy` maps over `s.doc.nodes` on every drag event in `src/store.ts:100`; `Canvas` subscribes to the whole store in `src/components/Canvas.tsx:17` and maps all nodes in `src/components/Canvas.tsx:79`. | Keep active drag position outside the persisted document during drag. Render the dragged node via transient local/rAF state or an overlay, then commit to `doc.nodes` once in `endDrag`. |
| 2 | Critical | All 7,000 `Shape` components re-render during drag. | `Canvas` re-renders on every store update and recreates every `Shape`; `Shape` is not memoized in `src/components/Shape.tsx:11`; `onPointerDown` is an inline closure in `src/components/Canvas.tsx:85`. | Subscribe each shape to only the node data it needs, or memoize shapes and pass stable handlers. Best fix: avoid parent-wide re-render during drag. |
| 3 | High | Per-frame CPU work is intentionally duplicated over every node. | `moveDragBy` computes a full checksum loop in `src/store.ts:102`; `Canvas` calls `expensiveDerivedWork(store.doc.nodes)` every render in `src/components/Canvas.tsx:20`; `expensiveDerivedWork` loops all nodes with trig calls in `src/utils.ts:38`. | Remove debug/derived work from the drag render path. Memoize true derived data by stable inputs, or compute it off the critical path. |
| 4 | High | Drag uses array scans and `selectedIds.includes` inside node loops. | `moveDragBy` checks `s.ui.selectedIds.includes(n.id)` for every node in `src/store.ts:110`; `Canvas` checks selection for every rendered node in `src/components/Canvas.tsx:83`; `LayersPanel` does the same in `src/components/LayersPanel.tsx:15`. | Store selection as a `Set` or derive a `Set` once per render/action. Maintain a node lookup map by id for updates and reads. |
| 5 | High | Store subscriptions are too broad, so unrelated UI re-renders on drag. | `App`, `Canvas`, `LayersPanel`, and `PropertiesPanel` each call `useEditorStore()` without selectors in `src/App.tsx:7`, `src/components/Canvas.tsx:17`, `src/components/LayersPanel.tsx:5`, and `src/components/PropertiesPanel.tsx:12`. | Use Zustand selectors with shallow comparison so components subscribe only to the fields they need. Keep frequently-changing drag state separated from stable document state. |
| 6 | High | Properties panel violates the acceptance criteria if enabled. | `PropertiesPanel` subscribes to the full store and reads `store.doc.nodes` every render in `src/components/PropertiesPanel.tsx:12` and `src/components/PropertiesPanel.tsx:16`. Since `doc.nodes` changes on every drag frame, the panel updates every frame. | Subscribe to selected id and committed selected-node data only. Do not update committed document coordinates until drag end, or keep a last-committed snapshot for the panel while dragging. |
| 7 | Medium | Layers panel is unvirtualized and recomputes thousands of rows on every relevant store update. | `LayersPanel` filters/maps all nodes in `src/components/LayersPanel.tsx:10` and renders up to 5,000 rows in `src/components/LayersPanel.tsx:32`. With broad subscription, drag updates would trigger this work. | Virtualize the list, memoize filtering by query and node list, and keep it unsubscribed from transient drag state. |
| 8 | Medium | Layout reads happen on every pointer move. | `getPointerPositionWithin` calls `getBoundingClientRect()` in `src/components/Canvas.tsx:12`; `handlePointerMove` calls it every drag event in `src/components/Canvas.tsx:39`. | Cache the viewport rect at drag start, or compute movement from `clientX/clientY` deltas against the initial pointer. |
| 9 | Medium | Positioning uses `left`/`top`, which is more expensive for active motion than transforms. | `Shape` applies `left` and `top` in `src/components/Shape.tsx:19`. | For active drag, render movement with `transform: translate(...)` and commit final `x/y` afterward. This pairs well with an overlay/ghost dragged element. |
| 10 | Medium | Render logging can make the app unusable at 7,000 nodes. | `useRenderCount` logs after every render in `src/useRenderCount.ts:7`; render logging is passed to every `Shape` in `src/components/Canvas.tsx:84`. | Keep render logging off by default, sample logs, aggregate counts, or log only selected components. |
| 11 | Low | Drag start has avoidable large scans. | `selectAndStartDrag` loops selected ids and calls `s.doc.nodes.find` for each in `src/store.ts:83`. | Keep nodes indexed by id or build a temporary map once. This mostly affects drag start, not per-frame latency. |
| 12 | Low | Disabled overlay would add significant drag work if restored. | `MatrixOverlay` builds 19,600 characters whenever `seed` changes in `src/components/MatrixOverlay.tsx:5`; `Canvas` previously used `store.ui.debugTick` as the seed in `src/components/Canvas.tsx:64`, and `debugTick` changes on drag in `src/store.ts:119`. | Keep debug overlays independent from drag ticks, or render them once unless explicitly profiling. |

## Highest-Leverage Fix Order

1. Stop mutating `doc.nodes` on every pointer move. Use transient drag state and commit once on pointer up.
2. Narrow Zustand subscriptions with selectors so `App`, panels, and canvas children do not re-render for unrelated fields.
3. Prevent full `Shape` tree re-renders during drag with memoized/stable props or per-node subscriptions.
4. Remove or isolate debug/derived O(n) work from the drag path.
5. Use `Set`/maps for selected ids and node lookups.
6. Virtualize the Layers panel and freeze Properties panel updates during active drag.

## Expected Result

The main latency source is not one expensive line; it is the combination of per-pointer-move global state updates, O(n) document scans, and React reconciling thousands of shapes. The target behavior should come from making drag mostly local/transient, then committing a small document update after drag ends.

## Verification

- `bun run build` passes.
