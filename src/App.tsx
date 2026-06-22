import { useEditorStore } from './store';
import { Canvas } from './components/Canvas';
import { LayersPanel } from './components/LayersPanel';
import { PropertiesPanel } from './components/PropertiesPanel';

export function App() {
  const store = useEditorStore();

  return (
    <div className="layout">
      <header className="topbar">
        <div className="topbar__title">Mini Editor</div>

        <label className="topbar__field">
          <span>Nodes</span>
          <input
            type="number"
            value={store.nodeCount}
            onChange={(e) => store.setNodeCount(Number(e.target.value))}
            className="topbar__nodes-input"
          />
        </label>

        <button
          onClick={() => store.reset(store.nodeCount)}
          className="topbar__button"
        >
          Reset document
        </button>

        <label className="topbar__field">
          <input
            type="checkbox"
            checked={store.ui.isRenderLoggingEnabled}
            onChange={(e) => store.toggleRenderLogging(e.target.checked)}
          />
          <span>Render logging</span>
        </label>

        <div className="topbar__spacer" />
        <div className="topbar__hint">Slow dragging</div>
      </header>

      <div className="shell">
        {/* <LayersPanel /> */}
        <Canvas />
        {/* <PropertiesPanel /> */}
      </div>
    </div>
  );
}
