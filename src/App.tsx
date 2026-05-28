import { useEffect } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { ExportPanel } from './components/ExportPanel';
import { PreviewScene } from './components/PreviewScene';
import { useMedalModel } from './hooks/useMedalModel';
import { copy } from './i18n';
import { useMedalStore } from './store/useMedalStore';

export function App() {
  const config = useMedalStore((state) => state.config);
  const svg = useMedalStore((state) => state.svg);
  const backSvg = useMedalStore((state) => state.backSvg);
  const language = useMedalStore((state) => state.language);
  const { status, model, error } = useMedalModel(config, svg, backSvg);
  const t = copy[language];

  useEffect(() => {
    document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
    document.title = t.documentTitle;
  }, [language, t.documentTitle]);

  return (
    <main className="app-shell">
      <ControlPanel />
      <section className="workspace">
        <div className="preview-header">
          <div>
            <p>{t.preview.eyebrow}</p>
            <h2>{t.preview.title}</h2>
          </div>
          <div className="view-hint">{t.preview.hint}</div>
        </div>
        <PreviewScene model={model} config={config} />
        <ExportPanel status={status} model={model} config={config} error={error} language={language} />
      </section>
    </main>
  );
}
