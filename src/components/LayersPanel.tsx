import { useEditorStore } from "../store";
import { useRenderCount } from "../useRenderCount";

export function LayersPanel() {
  const store = useEditorStore();
  useRenderCount("LayersPanel", store.ui.isRenderLoggingEnabled);

  const query = store.ui.layerQuery.toLowerCase();

  const rows = store.doc.nodes
    .filter((n) => n.name.toLowerCase().includes(query))
    .map((n) => ({
      id: n.id,
      name: n.name,
      isSelected: store.ui.selectedIds.includes(n.id),
    }));

  return (
    <aside className="panel layers">
      <div className="panel__header">
        <div className="panel__title">Layers</div>
        <input
          placeholder="Search"
          value={store.ui.layerQuery}
          onChange={(e) => store.setLayerQuery(e.target.value)}
          className="layers__search"
        />
        <div className="panel__sub">Total {store.doc.nodes.length} nodes</div>
      </div>

      <div className="panel__body">
        {rows.slice(0, 5000).map((row) => (
          <div
            key={row.id}
            onClick={() => store.selectOnly(row.id)}
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
