import { useMemo } from "react";
import { useEditorStore } from "../store";
import { useRenderCount } from "../useRenderCount";

export function LayersPanel() {
  const isRenderLoggingEnabled = useEditorStore((state) => state.ui.isRenderLoggingEnabled);
  const layerQuery = useEditorStore((state) => state.ui.layerQuery);
  const nodesLength = useEditorStore((state) => state.doc.nodes.length);
  const selectedIds = useEditorStore((state) => state.ui.selectedIds);
  const selectOnly = useEditorStore((state) => state.selectOnly);
  const setLayerQuery = useEditorStore((state) => state.setLayerQuery);
  useRenderCount("LayersPanel", isRenderLoggingEnabled);

  const query = layerQuery.toLowerCase();

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const rows = useMemo(() => {
    const nodes = useEditorStore.getState().doc.nodes;
    return nodes
      .filter((n) => n.name.toLowerCase().includes(query))
      .map((n) => ({
        id: n.id,
        name: n.name,
        isSelected: selectedSet.has(n.id),
      }));
  }, [query, selectedSet, nodesLength]);

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

      <div className="panel__body">
        {rows.slice(0, 5000).map((row) => (
          <div
            key={row.id}
            onClick={() => selectOnly(row.id)}
            className={`layer-row ${row.isSelected ? "layer-row--selected" : ""}`}
          >
            <span className="layer-row__name">{row.name}</span>
            <span className="layer-row__id">{row.id}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
