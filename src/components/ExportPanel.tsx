import { Download, FileArchive, FileBox, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { createExportBlob, downloadBlob, exportFileName } from '../export/exporters';
import type { BuildStatus, ExportFormat, MedalConfig, ModelBuffers } from '../domain/types';

const exportOptions: Array<{ format: ExportFormat; label: string; detail: string; icon: typeof FileBox }> = [
  { format: 'stl', label: 'STL', detail: '3D 打印，毫米单位', icon: FileBox },
  { format: 'glb', label: 'GLB', detail: '保留材质，米单位', icon: FileArchive },
  { format: 'usdz', label: 'USDZ', detail: 'Apple Quick Look / AR', icon: Smartphone }
];

export function ExportPanel({
  status,
  model,
  config,
  error
}: {
  status: BuildStatus;
  model: ModelBuffers | null;
  config: MedalConfig;
  error: string | null;
}) {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const disabled = !model || status === 'generating' || Boolean(exporting);

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
    <section className="export-panel" aria-label="导出模型">
      <div className="status-row">
        <span className={`status-dot ${status}`} />
        <span>{status === 'generating' ? '正在生成模型' : status === 'ready' ? '模型已就绪' : status === 'error' ? '生成失败' : '等待生成'}</span>
      </div>

      {model && (
        <div className="stats-grid">
          <div>
            <span>三角面</span>
            <strong>{model.triangleCount.toLocaleString()}</strong>
          </div>
          <div>
            <span>顶点</span>
            <strong>{model.vertexCount.toLocaleString()}</strong>
          </div>
          <div>
            <span>体积</span>
            <strong>{model.volume.toFixed(1)} mm³</strong>
          </div>
          <div>
            <span>表面积</span>
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
        {exportOptions.map(({ format, label, detail, icon: Icon }) => (
          <button key={format} type="button" disabled={disabled} onClick={() => handleExport(format)} title={detail}>
            <Icon size={18} />
            <span>
              {exporting === format ? '导出中' : label}
              <small>{detail}</small>
            </span>
            <Download size={15} />
          </button>
        ))}
      </div>

      <p className="format-note">STL 不保存颜色或材质；GLB/USDZ 会保留当前金属材质设置。</p>
    </section>
  );
}
