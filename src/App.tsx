import { Axis3d, Circle, PanelRight, PanelTop, ScanEye } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { ExportPanel } from './components/ExportPanel';
import { PreviewScene, type PreviewView } from './components/PreviewScene';
import { useMedalModel } from './hooks/useMedalModel';
import { copy } from './i18n';
import { useMedalStore } from './store/useMedalStore';

const viewOptions: Array<{ value: PreviewView; icon: typeof ScanEye }> = [
  { value: 'iso', icon: Axis3d },
  { value: 'front', icon: ScanEye },
  { value: 'back', icon: Circle },
  { value: 'right', icon: PanelRight },
  { value: 'top', icon: PanelTop }
];

export function App() {
  const config = useMedalStore((state) => state.config);
  const svg = useMedalStore((state) => state.svg);
  const backSvg = useMedalStore((state) => state.backSvg);
  const language = useMedalStore((state) => state.language);
  const themeMode = useMedalStore((state) => state.themeMode);
  const [previewView, setPreviewView] = useState<PreviewView>('iso');
  const [previewViewRequest, setPreviewViewRequest] = useState(0);
  const { status, model, error } = useMedalModel(config, svg, backSvg);
  const t = copy[language];

  useEffect(() => {
    document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
    document.title = t.documentTitle;
  }, [language, t.documentTitle]);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    document.documentElement.style.colorScheme = themeMode === 'dark' ? 'dark' : themeMode === 'light' ? 'light' : 'light dark';
  }, [themeMode]);

  return (
    <main className="app-shell">
      <ControlPanel />
      <section className="workspace">
        <div className="preview-layout">
          <div className="preview-main">
            <div className="preview-header">
              <div>
                <p>{t.preview.eyebrow}</p>
                <h2>{t.preview.title}</h2>
              </div>
              <div className="preview-actions">
                <div className="view-controls" role="group" aria-label={t.preview.title}>
                  {viewOptions.map(({ value, icon: Icon }) => (
                    <button
                      key={value}
                      className={previewView === value ? 'view-button is-selected' : 'view-button'}
                      type="button"
                      onClick={() => {
                        setPreviewView(value);
                        setPreviewViewRequest((request) => request + 1);
                      }}
                      title={t.views[value]}
                      aria-pressed={previewView === value}
                    >
                      <Icon size={15} />
                      <span>{t.views[value]}</span>
                    </button>
                  ))}
                </div>
                <div className="view-hint">{t.preview.hint}</div>
              </div>
            </div>
            <PreviewScene model={model} config={config} view={previewView} viewRequest={previewViewRequest} themeMode={themeMode} />
          </div>
          <div className="preview-sidebar">
            <ExportPanel status={status} model={model} config={config} error={error} language={language} />
          </div>
        </div>
      </section>
    </main>
  );
}
