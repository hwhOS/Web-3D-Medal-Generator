import { ControlPanel } from './components/ControlPanel';
import { ExportPanel } from './components/ExportPanel';
import { PreviewScene } from './components/PreviewScene';
import { useMedalModel } from './hooks/useMedalModel';
import { useMedalStore } from './store/useMedalStore';

export function App() {
  const config = useMedalStore((state) => state.config);
  const svg = useMedalStore((state) => state.svg);
  const { status, model, error } = useMedalModel(config, svg);

  return (
    <main className="app-shell">
      <ControlPanel />
      <section className="workspace">
        <div className="preview-header">
          <div>
            <p>实时预览</p>
            <h2>3D 奖牌模型</h2>
          </div>
          <div className="view-hint">拖拽旋转 · 滚轮缩放</div>
        </div>
        <PreviewScene model={model} config={config} />
        <ExportPanel status={status} model={model} config={config} error={error} />
      </section>
    </main>
  );
}
