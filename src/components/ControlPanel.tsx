import {
  Box,
  Circle,
  FileUp,
  Hexagon,
  Palette,
  Pentagon,
  RotateCcw,
  Shield,
  SlidersHorizontal,
  SquareRoundCorner,
  Type
} from 'lucide-react';
import type { ChangeEvent } from 'react';
import { materialPresets } from '../domain/materials';
import type { MedalShape } from '../domain/types';
import { useMedalStore } from '../store/useMedalStore';

const shapeOptions: Array<{ value: MedalShape; label: string; icon: typeof Circle }> = [
  { value: 'circle', label: '圆形', icon: Circle },
  { value: 'oval', label: '椭圆', icon: Circle },
  { value: 'rounded-rect', label: '圆角矩形', icon: SquareRoundCorner },
  { value: 'polygon', label: '多边形', icon: Hexagon },
  { value: 'shield', label: '盾形', icon: Shield }
];

function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="field">
      <span>
        {label}
        <strong>
          {value}
          {unit}
        </strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </label>
  );
}

export function ControlPanel() {
  const { config, svg, backSvg, setConfig, setMaterialPreset, setSvg, setBackSvg, reset } = useMedalStore();

  const readSvgUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) {
      return null;
    }

    const text = await file.text();
    input.value = '';
    return {
      text,
      fileName: file.name
    };
  };

  const handleSvgUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const nextSvg = await readSvgUpload(event);
    if (nextSvg) {
      setSvg(nextSvg);
    }
  };

  const handleBackSvgUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const nextSvg = await readSvgUpload(event);
    if (nextSvg) {
      setBackSvg(nextSvg);
    }
  };

  return (
    <aside className="control-panel" aria-label="奖牌参数">
      <div className="panel-title">
        <Box size={20} />
        <div>
          <h1>奖牌生成器</h1>
          <p>SVG 浮雕到 3D 奖牌模型</p>
        </div>
      </div>

      <section className="control-section">
        <div className="section-title">
          <Pentagon size={16} />
          <h2>形状</h2>
        </div>
        <div className="shape-grid">
          {shapeOptions.map(({ value, label, icon: Icon }) => (
            <button
              className={config.shape === value ? 'choice is-selected' : 'choice'}
              key={value}
              type="button"
              onClick={() => setConfig({ shape: value })}
              title={label}
            >
              <Icon size={17} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="control-section">
        <div className="section-title">
          <SlidersHorizontal size={16} />
          <h2>尺寸</h2>
        </div>
        {config.shape === 'circle' ? (
          <NumberField
            label="直径"
            value={config.diameter}
            min={36}
            max={120}
            unit="mm"
            onChange={(diameter) => setConfig({ diameter, width: diameter, height: diameter })}
          />
        ) : (
          <>
            <NumberField label="宽度" value={config.width} min={36} max={140} unit="mm" onChange={(width) => setConfig({ width })} />
            <NumberField label="高度" value={config.height} min={36} max={140} unit="mm" onChange={(height) => setConfig({ height })} />
          </>
        )}
        <NumberField label="厚度" value={config.thickness} min={2} max={14} step={0.5} unit="mm" onChange={(thickness) => setConfig({ thickness })} />
        <NumberField label="边缘倒角" value={config.edgeBevel} min={0} max={4} step={0.1} unit="mm" onChange={(edgeBevel) => setConfig({ edgeBevel })} />
        {config.shape === 'rounded-rect' && (
          <NumberField label="圆角" value={config.cornerRadius} min={0} max={24} unit="mm" onChange={(cornerRadius) => setConfig({ cornerRadius })} />
        )}
        {config.shape === 'polygon' && (
          <NumberField label="边数" value={config.polygonSides} min={3} max={12} onChange={(polygonSides) => setConfig({ polygonSides })} />
        )}
        <NumberField label="曲线精度" value={config.quality} min={32} max={160} step={4} onChange={(quality) => setConfig({ quality })} />
      </section>

      <section className="control-section">
        <div className="section-title">
          <FileUp size={16} />
          <h2>SVG 纹理</h2>
        </div>
        <input
          id="front-svg-upload"
          className="upload-input"
          type="file"
          accept=".svg,image/svg+xml"
          aria-label="上传 SVG 图像"
          onChange={handleSvgUpload}
        />
        <div className="upload-file-name">{svg ? svg.fileName : '未选择 SVG 文件'}</div>
        {svg && (
          <button className="text-button" type="button" onClick={() => setSvg(null)}>
            移除 SVG
          </button>
        )}
        <div className="segmented">
          <button
            className={config.reliefMode === 'raised' ? 'is-selected' : ''}
            type="button"
            onClick={() => setConfig({ reliefMode: 'raised' })}
          >
            凸起
          </button>
          <button
            className={config.reliefMode === 'engraved' ? 'is-selected' : ''}
            type="button"
            onClick={() => setConfig({ reliefMode: 'engraved' })}
          >
            凹刻
          </button>
        </div>
        <NumberField label="浮雕深度" value={config.reliefDepth} min={0.2} max={4} step={0.1} unit="mm" onChange={(reliefDepth) => setConfig({ reliefDepth })} />
        <NumberField label="缩放" value={config.reliefScale} min={20} max={110} unit="%" onChange={(reliefScale) => setConfig({ reliefScale })} />
        <NumberField label="旋转" value={config.reliefRotation} min={-180} max={180} unit="deg" onChange={(reliefRotation) => setConfig({ reliefRotation })} />
        <NumberField label="水平偏移" value={config.reliefOffsetX} min={-30} max={30} unit="mm" onChange={(reliefOffsetX) => setConfig({ reliefOffsetX })} />
        <NumberField label="垂直偏移" value={config.reliefOffsetY} min={-30} max={30} unit="mm" onChange={(reliefOffsetY) => setConfig({ reliefOffsetY })} />
      </section>

      <section className="control-section">
        <div className="section-title">
          <Type size={16} />
          <h2>背面刻字</h2>
        </div>
        <label className="text-field">
          <span>文字</span>
          <textarea
            aria-label="背面文字"
            rows={3}
            placeholder={'EARNED BY TONY\nON 17 MAY 2026'}
            value={config.backText}
            onChange={(event) => setConfig({ backText: event.currentTarget.value.toUpperCase() })}
          />
        </label>
        <NumberField label="文字大小" value={config.backTextSize} min={1.5} max={8} step={0.1} unit="mm" onChange={(backTextSize) => setConfig({ backTextSize })} />
        <NumberField label="刻字高度" value={config.backMarkDepth} min={0.1} max={1.5} step={0.05} unit="mm" onChange={(backMarkDepth) => setConfig({ backMarkDepth })} />
        <NumberField label="文字垂直位置" value={config.backTextOffsetY} min={-24} max={24} unit="mm" onChange={(backTextOffsetY) => setConfig({ backTextOffsetY })} />
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={config.backLogoEnabled}
            onChange={(event) => setConfig({ backLogoEnabled: event.currentTarget.checked })}
          />
          <span>显示背面小 SVG</span>
        </label>
        <input
          id="back-svg-upload"
          className="upload-input"
          type="file"
          accept=".svg,image/svg+xml"
          aria-label="上传背面 SVG"
          onChange={handleBackSvgUpload}
        />
        <div className="upload-file-name">{backSvg ? backSvg.fileName : '未选择背面 SVG'}</div>
        {backSvg && (
          <button className="text-button" type="button" onClick={() => setBackSvg(null)}>
            移除背面 SVG
          </button>
        )}
        <label className="color-row">
          <span>刻字颜色</span>
          <input type="color" value={config.backMarkColor} onChange={(event) => setConfig({ backMarkColor: event.currentTarget.value })} />
        </label>
        <NumberField label="SVG 宽度" value={config.backLogoWidth} min={3} max={24} step={0.5} unit="mm" onChange={(backLogoWidth) => setConfig({ backLogoWidth })} />
        <NumberField label="SVG 垂直位置" value={config.backLogoOffsetY} min={-28} max={16} unit="mm" onChange={(backLogoOffsetY) => setConfig({ backLogoOffsetY })} />
      </section>

      <section className="control-section">
        <div className="section-title">
          <Palette size={16} />
          <h2>材质</h2>
        </div>
        <div className="material-grid">
          {Object.entries(materialPresets).map(([key, preset]) => (
            <button
              className={config.materialPreset === key ? 'material-choice is-selected' : 'material-choice'}
              key={key}
              type="button"
              onClick={() => setMaterialPreset(key as keyof typeof materialPresets)}
              title={preset.label}
            >
              <span className="swatch" style={{ backgroundColor: preset.color }} />
              {preset.label}
            </button>
          ))}
          <button
            className={config.materialPreset === 'custom' ? 'material-choice is-selected' : 'material-choice'}
            type="button"
            onClick={() => setMaterialPreset('custom')}
          >
            <span className="swatch custom-swatch" />
            自定义
          </button>
        </div>
        <label className="color-row">
          <span>颜色</span>
          <input type="color" value={config.color} onChange={(event) => setConfig({ color: event.currentTarget.value, materialPreset: 'custom' })} />
        </label>
        <NumberField label="金属度" value={config.metalness} min={0} max={1} step={0.05} onChange={(metalness) => setConfig({ metalness, materialPreset: 'custom' })} />
        <NumberField label="粗糙度" value={config.roughness} min={0.05} max={0.9} step={0.05} onChange={(roughness) => setConfig({ roughness, materialPreset: 'custom' })} />
      </section>

      <button className="reset-button" type="button" onClick={reset}>
        <RotateCcw size={16} />
        重置参数
      </button>
    </aside>
  );
}
