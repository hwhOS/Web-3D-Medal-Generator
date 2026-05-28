import { Axis3d, Circle, PanelRight, PanelTop, ScanEye, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { ExportPanel } from './components/ExportPanel';
import { PreviewScene, type PreviewSettings, type PreviewView } from './components/PreviewScene';
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

const defaultPreviewSettings: PreviewSettings = {
  showGrid: true,
  showShadows: true,
  ambientLight: 0.85,
  keyLight: 2.2,
  fillLight: 0.8
};

function PreviewSlider({
  label,
  value,
  min,
  max,
  step,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="field compact-field">
      <span>
        {label}
        <strong>{value.toFixed(2).replace(/\.00$/, '')}</strong>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.currentTarget.value))} />
    </label>
  );
}

export function App() {
  const config = useMedalStore((state) => state.config);
  const svg = useMedalStore((state) => state.svg);
  const backSvg = useMedalStore((state) => state.backSvg);
  const language = useMedalStore((state) => state.language);
  const themeMode = useMedalStore((state) => state.themeMode);
  const [previewView, setPreviewView] = useState<PreviewView>('iso');
  const [previewViewRequest, setPreviewViewRequest] = useState(0);
  const [previewSettings, setPreviewSettings] = useState<PreviewSettings>(defaultPreviewSettings);
  const { status, model, error } = useMedalModel(config, svg, backSvg);
  const t = copy[language];

  const patchPreviewSettings = (patch: Partial<PreviewSettings>) => {
    setPreviewSettings((current) => ({ ...current, ...patch }));
  };

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
              <div className="view-hint">{t.preview.hint}</div>
            </div>
            <PreviewScene
              model={model}
              config={config}
              view={previewView}
              viewRequest={previewViewRequest}
              settings={previewSettings}
              themeMode={themeMode}
            />
          </div>
          <div className="preview-sidebar">
            <section className="preview-panel" aria-label={t.previewSettings.views}>
              <div className="sidebar-section-title">
                <ScanEye size={16} />
                <h3>{t.previewSettings.views}</h3>
              </div>
              <div className="view-controls sidebar-view-controls" role="group" aria-label={t.preview.title}>
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
            </section>
            <section className="preview-panel" aria-label={t.previewSettings.advanced}>
              <div className="sidebar-section-title">
                <SlidersHorizontal size={16} />
                <h3>{t.previewSettings.advanced}</h3>
              </div>
              <label className="toggle-row advanced-toggle">
                <input
                  type="checkbox"
                  checked={previewSettings.showGrid}
                  onChange={(event) => patchPreviewSettings({ showGrid: event.currentTarget.checked })}
                />
                <span>{t.previewSettings.showGrid}</span>
              </label>
              <label className="toggle-row advanced-toggle">
                <input
                  type="checkbox"
                  checked={previewSettings.showShadows}
                  onChange={(event) => patchPreviewSettings({ showShadows: event.currentTarget.checked })}
                />
                <span>{t.previewSettings.showShadows}</span>
              </label>
              <PreviewSlider
                label={t.previewSettings.ambientLight}
                value={previewSettings.ambientLight}
                min={0}
                max={2}
                step={0.05}
                onChange={(ambientLight) => patchPreviewSettings({ ambientLight })}
              />
              <PreviewSlider
                label={t.previewSettings.keyLight}
                value={previewSettings.keyLight}
                min={0}
                max={4}
                step={0.05}
                onChange={(keyLight) => patchPreviewSettings({ keyLight })}
              />
              <PreviewSlider
                label={t.previewSettings.fillLight}
                value={previewSettings.fillLight}
                min={0}
                max={3}
                step={0.05}
                onChange={(fillLight) => patchPreviewSettings({ fillLight })}
              />
            </section>
            <ExportPanel status={status} model={model} config={config} error={error} language={language} />
          </div>
        </div>
      </section>
    </main>
  );
}
