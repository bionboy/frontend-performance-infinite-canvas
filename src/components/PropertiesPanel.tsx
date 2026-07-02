import type { NodeRect } from "../types";
import { useEditorStore } from "../store";
import { useRenderCount } from "../useRenderCount";
import { useCallback, useEffect, useMemo } from "react";

export function PropertiesPanel() {
  const isRenderLoggingEnabled = useEditorStore((state) => state.ui.isRenderLoggingEnabled);
  const isDragging = useEditorStore((state) => state.ui.isDragging);
  const selectedId = useEditorStore((state) => state.ui.selectedIds[0] ?? null);
  const patchSelected = useEditorStore((state) => state.patchSelected);

  const node = useMemo(
    () => useEditorStore.getState().doc.nodeById[selectedId],
    [selectedId, isDragging],
  );

  useRenderCount("PropertiesPanel", isRenderLoggingEnabled);

  return (
    <aside className="panel properties">
      <div className="panel__header">
        <div className="panel__title">Properties</div>
        <div className="panel__sub">{node ? node.id : "No selection"}</div>
      </div>

      <div className="form">
        {!node ? (
          <div className="form__empty">Select a shape</div>
        ) : (
          <>
            <label className="field">
              <span>X</span>
              <input
                className="field__input"
                type="number"
                value={Math.round(node.x)}
                onChange={(e) => patchSelected({ x: Number(e.target.value) })}
              />
            </label>
            <label className="field">
              <span>Y</span>
              <input
                className="field__input"
                type="number"
                value={Math.round(node.y)}
                onChange={(e) => patchSelected({ y: Number(e.target.value) })}
              />
            </label>
            <label className="field">
              <span>W</span>
              <input
                className="field__input"
                type="number"
                value={node.w}
                onChange={(e) => patchSelected({ w: Number(e.target.value) })}
              />
            </label>
            <label className="field">
              <span>H</span>
              <input
                className="field__input"
                type="number"
                value={node.h}
                onChange={(e) => patchSelected({ h: Number(e.target.value) })}
              />
            </label>
          </>
        )}
      </div>
    </aside>
  );
}
