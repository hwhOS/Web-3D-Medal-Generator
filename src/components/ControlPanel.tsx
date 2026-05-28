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
import { createDefaultBackText } from '../domain/defaults';
import { materialPresets } from '../domain/materials';
import { findSvgSampleId, getSvgSampleInput, svgSamples, type SvgSampleId } from '../domain/svgSamples';
import type { MaterialPreset, MedalShape } from '../domain/types';
import { copy } from '../i18n';
import { useMedalStore } from '../store/useMedalStore';

const shapeOptions: Array<{ value: MedalShape; icon: typeof Circle }> = [
  { value: 'circle', icon: Circle },
  { value: 'oval', icon: Circle },
  { value: 'rounded-rect', icon: SquareRoundCorner },
  { value: 'polygon', icon: Hexagon },
  { value: 'shield', icon: Shield }
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
  const { config, svg, backSvg, language, setConfig, setMaterialPreset, setLanguage, setSvg, setBackSvg, reset } = useMedalStore();
  const t = copy[language];
  const frontSampleId = findSvgSampleId(svg);
  const backSampleId = findSvgSampleId(backSvg);

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

  const handleFrontSampleSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.currentTarget.value;
    if (value === 'none') {
      setSvg(null);
    } else if (value !== 'custom') {
      setSvg(getSvgSampleInput(value as SvgSampleId));
    }
  };

  const handleBackSampleSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.currentTarget.value;
    if (value === 'none') {
      setBackSvg(null);
    } else if (value !== 'custom') {
      setBackSvg(getSvgSampleInput(value as SvgSampleId));
    }
  };

  return (
    <aside className="control-panel" aria-label={t.controlAria}>
      <div className="panel-title">
        <Box size={20} />
        <div>
          <h1>{t.appTitle}</h1>
          <p>{t.appSubtitle}</p>
        </div>
      </div>
      <div className="language-toggle" role="group" aria-label={t.language}>
        <button className={language === 'en' ? 'is-selected' : ''} type="button" onClick={() => setLanguage('en')}>
          EN
        </button>
        <button className={language === 'zh' ? 'is-selected' : ''} type="button" onClick={() => setLanguage('zh')}>
          中文
        </button>
      </div>

      <section className="control-section">
        <div className="section-title">
          <Pentagon size={16} />
          <h2>{t.sections.shape}</h2>
        </div>
        <div className="shape-grid">
          {shapeOptions.map(({ value, icon: Icon }) => {
            const label = t.shapes[value];
            return (
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
            );
          })}
        </div>
      </section>

      <section className="control-section">
        <div className="section-title">
          <SlidersHorizontal size={16} />
          <h2>{t.sections.dimensions}</h2>
        </div>
        {config.shape === 'circle' ? (
          <NumberField
            label={t.fields.diameter}
            value={config.diameter}
            min={36}
            max={120}
            unit="mm"
            onChange={(diameter) => setConfig({ diameter, width: diameter, height: diameter })}
          />
        ) : (
          <>
            <NumberField label={t.fields.width} value={config.width} min={36} max={140} unit="mm" onChange={(width) => setConfig({ width })} />
            <NumberField label={t.fields.height} value={config.height} min={36} max={140} unit="mm" onChange={(height) => setConfig({ height })} />
          </>
        )}
        <NumberField label={t.fields.thickness} value={config.thickness} min={2} max={14} step={0.5} unit="mm" onChange={(thickness) => setConfig({ thickness })} />
        <NumberField label={t.fields.edgeBevel} value={config.edgeBevel} min={0} max={4} step={0.1} unit="mm" onChange={(edgeBevel) => setConfig({ edgeBevel })} />
        {config.shape === 'rounded-rect' && (
          <NumberField label={t.fields.cornerRadius} value={config.cornerRadius} min={0} max={24} unit="mm" onChange={(cornerRadius) => setConfig({ cornerRadius })} />
        )}
        {config.shape === 'polygon' && (
          <NumberField label={t.fields.polygonSides} value={config.polygonSides} min={3} max={12} onChange={(polygonSides) => setConfig({ polygonSides })} />
        )}
        <NumberField label={t.fields.quality} value={config.quality} min={48} max={240} step={4} onChange={(quality) => setConfig({ quality })} />
      </section>

      <section className="control-section">
        <div className="section-title">
          <FileUp size={16} />
          <h2>{t.sections.svg}</h2>
        </div>
        <label className="select-field">
          <span>{t.fields.frontSample}</span>
          <select value={frontSampleId} onChange={handleFrontSampleSelect}>
            <option value="none">{t.upload.noSample}</option>
            {svgSamples.map((sample) => (
              <option key={sample.id} value={sample.id}>
                {sample.label[language]}
              </option>
            ))}
            {frontSampleId === 'custom' && <option value="custom">{t.upload.uploadedSample}</option>}
          </select>
        </label>
        <input
          id="front-svg-upload"
          className="upload-input"
          type="file"
          accept=".svg,image/svg+xml"
          aria-label={t.upload.frontAria}
          onChange={handleSvgUpload}
        />
        <div className="upload-file-name">{svg ? svg.fileName : t.upload.noFront}</div>
        {svg && (
          <button className="text-button" type="button" onClick={() => setSvg(null)}>
            {t.upload.removeSvg}
          </button>
        )}
        <NumberField label={t.fields.reliefDepth} value={config.reliefDepth} min={0.1} max={1} step={0.05} unit="mm" onChange={(reliefDepth) => setConfig({ reliefDepth })} />
        <NumberField label={t.fields.scale} value={config.reliefScale} min={20} max={110} unit="%" onChange={(reliefScale) => setConfig({ reliefScale })} />
        <NumberField label={t.fields.rotation} value={config.reliefRotation} min={-180} max={180} unit="deg" onChange={(reliefRotation) => setConfig({ reliefRotation })} />
        <NumberField label={t.fields.offsetX} value={config.reliefOffsetX} min={-30} max={30} unit="mm" onChange={(reliefOffsetX) => setConfig({ reliefOffsetX })} />
        <NumberField label={t.fields.offsetY} value={config.reliefOffsetY} min={-30} max={30} unit="mm" onChange={(reliefOffsetY) => setConfig({ reliefOffsetY })} />
        <label className="color-row">
          <span>{t.fields.reliefColor}</span>
          <input type="color" value={config.reliefColor} onChange={(event) => setConfig({ reliefColor: event.currentTarget.value })} />
        </label>
        <NumberField label={t.fields.reliefMetalness} value={config.reliefMetalness} min={0} max={1} step={0.05} onChange={(reliefMetalness) => setConfig({ reliefMetalness })} />
        <NumberField label={t.fields.reliefRoughness} value={config.reliefRoughness} min={0} max={0.9} step={0.05} onChange={(reliefRoughness) => setConfig({ reliefRoughness })} />
      </section>

      <section className="control-section">
        <div className="section-title">
          <Type size={16} />
          <h2>{t.sections.back}</h2>
        </div>
        <label className="text-field">
          <span>{t.fields.text}</span>
          <textarea
            aria-label={t.fields.text}
            rows={3}
            placeholder={createDefaultBackText()}
            value={config.backText}
            onChange={(event) => setConfig({ backText: event.currentTarget.value.toUpperCase() })}
          />
        </label>
        <NumberField label={t.fields.textSize} value={config.backTextSize} min={1.5} max={8} step={0.1} unit="mm" onChange={(backTextSize) => setConfig({ backTextSize })} />
        <NumberField label={t.fields.markHeight} value={config.backMarkDepth} min={0.1} max={1} step={0.05} unit="mm" onChange={(backMarkDepth) => setConfig({ backMarkDepth })} />
        <NumberField label={t.fields.textOffsetY} value={config.backTextOffsetY} min={-24} max={24} unit="mm" onChange={(backTextOffsetY) => setConfig({ backTextOffsetY })} />
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={config.backLogoEnabled}
            onChange={(event) => setConfig({ backLogoEnabled: event.currentTarget.checked })}
          />
          <span>{t.fields.showBackSvg}</span>
        </label>
        <label className="select-field">
          <span>{t.fields.backSample}</span>
          <select value={backSampleId} onChange={handleBackSampleSelect}>
            <option value="none">{t.upload.noSample}</option>
            {svgSamples.map((sample) => (
              <option key={sample.id} value={sample.id}>
                {sample.label[language]}
              </option>
            ))}
            {backSampleId === 'custom' && <option value="custom">{t.upload.uploadedSample}</option>}
          </select>
        </label>
        <input
          id="back-svg-upload"
          className="upload-input"
          type="file"
          accept=".svg,image/svg+xml"
          aria-label={t.upload.backAria}
          onChange={handleBackSvgUpload}
        />
        <div className="upload-file-name">{backSvg ? backSvg.fileName : t.upload.noBack}</div>
        {backSvg && (
          <button className="text-button" type="button" onClick={() => setBackSvg(null)}>
            {t.upload.removeBackSvg}
          </button>
        )}
        <label className="color-row">
          <span>{t.fields.markColor}</span>
          <input type="color" value={config.backMarkColor} onChange={(event) => setConfig({ backMarkColor: event.currentTarget.value })} />
        </label>
        <NumberField label={t.fields.markMetalness} value={config.backMarkMetalness} min={0} max={1} step={0.05} onChange={(backMarkMetalness) => setConfig({ backMarkMetalness })} />
        <NumberField label={t.fields.markRoughness} value={config.backMarkRoughness} min={0} max={0.9} step={0.05} onChange={(backMarkRoughness) => setConfig({ backMarkRoughness })} />
        <NumberField label={t.fields.svgWidth} value={config.backLogoWidth} min={3} max={24} step={0.5} unit="mm" onChange={(backLogoWidth) => setConfig({ backLogoWidth })} />
        <NumberField label={t.fields.svgOffsetY} value={config.backLogoOffsetY} min={-28} max={16} unit="mm" onChange={(backLogoOffsetY) => setConfig({ backLogoOffsetY })} />
      </section>

      <section className="control-section">
        <div className="section-title">
          <Palette size={16} />
          <h2>{t.sections.material}</h2>
        </div>
        <div className="material-grid">
          {Object.entries(materialPresets).map(([key, preset]) => {
            const materialKey = key as Exclude<MaterialPreset, 'custom'>;
            const label = t.materials[materialKey];
            return (
              <button
                className={config.materialPreset === key ? 'material-choice is-selected' : 'material-choice'}
                key={key}
                type="button"
                onClick={() => setMaterialPreset(key as keyof typeof materialPresets)}
                title={label}
              >
                <span className="swatch" style={{ backgroundColor: preset.color }} />
                {label}
              </button>
            );
          })}
          <button
            className={config.materialPreset === 'custom' ? 'material-choice is-selected' : 'material-choice'}
            type="button"
            onClick={() => setMaterialPreset('custom')}
          >
            <span className="swatch custom-swatch" />
            {t.materials.custom}
          </button>
        </div>
        <label className="color-row">
          <span>{t.fields.baseColor}</span>
          <input type="color" value={config.color} onChange={(event) => setConfig({ color: event.currentTarget.value, materialPreset: 'custom' })} />
        </label>
        <NumberField label={t.fields.baseMetalness} value={config.metalness} min={0} max={1} step={0.05} onChange={(metalness) => setConfig({ metalness, materialPreset: 'custom' })} />
        <NumberField label={t.fields.baseRoughness} value={config.roughness} min={0.05} max={0.9} step={0.05} onChange={(roughness) => setConfig({ roughness, materialPreset: 'custom' })} />
      </section>

      <button className="reset-button" type="button" onClick={reset}>
        <RotateCcw size={16} />
        {t.reset}
      </button>
    </aside>
  );
}
