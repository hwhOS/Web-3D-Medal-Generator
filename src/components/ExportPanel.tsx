import { Download, FileArchive, FileBox, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { createExportBlob, downloadBlob, exportFileName } from '../export/exporters';
import type { BuildStatus, ExportFormat, MedalConfig, ModelBuffers } from '../domain/types';
import { copy, type Language } from '../i18n';

const exportOptions: Array<{ format: ExportFormat; label: string; icon: typeof FileBox }> = [
  { format: 'stl', label: 'STL', icon: FileBox },
  { format: 'glb', label: 'GLB', icon: FileArchive },
  { format: 'usdz', label: 'USDZ', icon: Smartphone }
];

export function ExportPanel({
  status,
  model,
  config,
  error,
  language
}: {
  status: BuildStatus;
  model: ModelBuffers | null;
  config: MedalConfig;
  error: string | null;
  language: Language;
}) {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const disabled = !model || status === 'generating' || Boolean(exporting);
  const t = copy[language].exportPanel;

  const handleExport = async (format: ExportFormat) => {
    if (!model) {
      return;
    }

    setExporting(format);
    try {
      const blob = await createExportBlob(format, model, config);
      downloadBlob(blob, exportFileName(format));
    } finally {
      setExporting(null);
    }
  };

  return (
    <section className="export-panel" aria-label={t.aria}>
      <div className="status-row">
        <span className={`status-dot ${status}`} />
        <span>{t.status[status]}</span>
      </div>

      {model && (
        <div className="stats-grid">
          <div>
            <span>{t.stats.triangles}</span>
            <strong>{model.triangleCount.toLocaleString()}</strong>
          </div>
          <div>
            <span>{t.stats.vertices}</span>
            <strong>{model.vertexCount.toLocaleString()}</strong>
          </div>
          <div>
            <span>{t.stats.volume}</span>
            <strong>{model.volume.toFixed(1)} mm³</strong>
          </div>
          <div>
            <span>{t.stats.surfaceArea}</span>
            <strong>{model.surfaceArea.toFixed(1)} mm²</strong>
          </div>
        </div>
      )}

      {error && <p className="error-text">{error}</p>}

      {model?.warnings.length ? (
        <ul className="warning-list">
          {model.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}

      <div className="export-buttons">
        {exportOptions.map(({ format, label, icon: Icon }) => (
          <button key={format} type="button" disabled={disabled} onClick={() => handleExport(format)} title={t.details[format]}>
            <Icon size={18} />
            <span>
              {exporting === format ? t.exporting : label}
              <small>{t.details[format]}</small>
            </span>
            <Download size={15} />
          </button>
        ))}
      </div>

      <p className="format-note">{t.note}</p>
    </section>
  );
}
