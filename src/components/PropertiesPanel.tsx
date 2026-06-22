import type { NodeRect } from '../types';
import { useEditorStore } from '../store';
import { useRenderCount } from '../useRenderCount';
import { useCallback, useEffect, useMemo } from 'react';

function getNodeById(nodes: NodeRect[], id: string | null): NodeRect | null {
  if (!id) return null;
  return nodes.find((n) => n.id === id) ?? null;
}

export function PropertiesPanel() {
  const store = useEditorStore();
  useRenderCount('PropertiesPanel', store.ui.isRenderLoggingEnabled);

  const selectedId = store.ui.selectedIds[0] ?? null;
  let node = getNodeById(store.doc.nodes, selectedId);

  /* useEffect(() => {
    if (store.ui.isDragging === false) {
      node = getNodeById(store.doc.nodes, selectedId);
    }
  }, [selectedId, store.ui.isDragging]);
  */

  return (
    <aside className="panel properties">
      <div className="panel__header">
        <div className="panel__title">Properties</div>
        <div className="panel__sub">{node ? node.id : 'No selection'}</div>
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
                onChange={(e) =>
                  store.patchSelected({ x: Number(e.target.value) })
                }
              />
            </label>
            <label className="field">
              <span>Y</span>
              <input
                className="field__input"
                type="number"
                value={Math.round(node.y)}
                onChange={(e) =>
                  store.patchSelected({ y: Number(e.target.value) })
                }
              />
            </label>
            <label className="field">
              <span>W</span>
              <input
                className="field__input"
                type="number"
                value={node.w}
                onChange={(e) =>
                  store.patchSelected({ w: Number(e.target.value) })
                }
              />
            </label>
            <label className="field">
              <span>H</span>
              <input
                className="field__input"
                type="number"
                value={node.h}
                onChange={(e) =>
                  store.patchSelected({ h: Number(e.target.value) })
                }
              />
            </label>
          </>
        )}
      </div>
    </aside>
  );
}
