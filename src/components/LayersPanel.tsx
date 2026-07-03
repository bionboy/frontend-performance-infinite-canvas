import { useMemo } from "react";
import { useEditorStore } from "../store";
import { useRenderCount } from "../hooks/rendering/useRenderCount";
import { useVirtualRows } from "../hooks/rendering/useVirtualRows";

const LAYER_ROW_HEIGHT = 24;
const LAYER_ROW_OVERSCAN = 8;

export function LayersPanel() {
  const isRenderLoggingEnabled = useEditorStore((state) => state.ui.isRenderLoggingEnabled);
  const layerQuery = useEditorStore((state) => state.ui.layerQuery);
  const nodesLength = useEditorStore((state) => state.doc.nodeIds.length);
  const selectedIds = useEditorStore((state) => state.ui.selectedIds);
  const selectOnly = useEditorStore((state) => state.selectOnly);
  const setLayerQuery = useEditorStore((state) => state.setLayerQuery);

  useRenderCount("LayersPanel", isRenderLoggingEnabled);

  const query = layerQuery.toLowerCase();

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const rows = useMemo(() => {
    const { nodeById, nodeIds } = useEditorStore.getState().doc;
    const nodes = nodeIds.map((id) => nodeById[id]);
    return nodes
      .filter((n) => n.name.toLowerCase().includes(query))
      .map((n) => ({
        id: n.id,
        name: n.name,
        isSelected: selectedSet.has(n.id),
      }));
  }, [query, selectedSet, nodesLength]);

  const { handleScroll, totalHeight, virtualRows, viewportRef } = useVirtualRows({
    rows,
    rowHeight: LAYER_ROW_HEIGHT,
    overscan: LAYER_ROW_OVERSCAN,
    resetKey: query,
  });

  return (
    <aside className="panel layers">
      <div className="panel__header">
        <div className="panel__title">Layers</div>
        <input
          placeholder="Search"
          value={layerQuery}
          onChange={(e) => setLayerQuery(e.target.value)}
          className="layers__search"
        />
        <div className="panel__sub">Total {nodesLength} nodes</div>
      </div>

      <div ref={viewportRef} className="panel__body" onScroll={handleScroll}>
        <div className="layers__virtual-list" style={{ height: totalHeight }}>
          {virtualRows.map(({ row, index, offsetY }) => (
            <div
              key={row.id}
              onClick={() => selectOnly(row.id)}
              className={`layer-row layer-row--virtual ${row.isSelected ? "layer-row--selected" : ""}`}
              style={{ transform: `translateY(${offsetY}px)` }}
            >
              <span className="layer-row__name">{row.name}</span>
              <span className="layer-row__id">{row.id}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
