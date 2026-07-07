import { useEditorStore } from "./store";
import { Canvas } from "./components/Canvas";
import { LayersPanel } from "./components/LayersPanel";
import { PropertiesPanel } from "./components/PropertiesPanel";

const MIN_NODES = 100;
const MAX_NODES = 20000;

export function App() {
  const nodeCount = useEditorStore((state) => state.nodeCount);
  const setNodeCount = useEditorStore((state) => state.setNodeCount);
  const reset = useEditorStore((state) => state.reset);
  const isRenderLoggingEnabled = useEditorStore((state) => state.ui.isRenderLoggingEnabled);
  const toggleRenderLogging = useEditorStore((state) => state.toggleRenderLogging);

  return (
    <div className="layout">
      <header className="topbar">
        <div className="topbar__brand">
          <div className="topbar__eyebrow">Infinite canvas</div>
          <div className="topbar__title">Mini Editor</div>
        </div>

        <div className="topbar__node-control" aria-label="Node count">
          <label className="topbar__field topbar__field--range">
            <span>Nodes</span>
            <input
              type="range"
              min={MIN_NODES}
              max={MAX_NODES}
              step={100}
              value={nodeCount}
              onChange={(e) => setNodeCount(Number(e.target.value))}
              className="topbar__nodes-range"
            />
          </label>
          <input
            type="number"
            min={MIN_NODES}
            max={MAX_NODES}
            value={nodeCount}
            onChange={(e) => setNodeCount(Number(e.target.value))}
            className="topbar__nodes-input"
            aria-label="Node count value"
          />
        </div>

        <button onClick={() => reset(nodeCount)} className="topbar__button">
          Refresh nodes
        </button>

        <label className="topbar__field topbar__field--check">
          <input
            type="checkbox"
            checked={isRenderLoggingEnabled}
            onChange={(e) => toggleRenderLogging(e.target.checked)}
          />
          <span>Render logging</span>
        </label>

        <div className="topbar__spacer" />
        <a
          className="topbar__github"
          href="https://github.com/bionboy/frontend-performance-infinite-canvas"
          target="_blank"
          rel="noreferrer"
          aria-label="Open GitHub repository"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="topbar__github-icon">
            <path d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.35 6.84 9.71.5.1.68-.22.68-.49v-1.9c-2.78.62-3.37-1.21-3.37-1.21-.45-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.56 2.35 1.11 2.92.85.09-.66.35-1.11.64-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.35 9.35 0 0 1 12 6.94c.85 0 1.7.12 2.5.34 1.9-1.33 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.8-4.57 5.05.36.32.68.95.68 1.92v2.79c0 .27.18.59.69.49A10.06 10.06 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z" />
          </svg>
          <span>GitHub</span>
        </a>
      </header>

      <div className="shell">
        <LayersPanel />
        <Canvas />
        <PropertiesPanel />
      </div>
    </div>
  );
}
