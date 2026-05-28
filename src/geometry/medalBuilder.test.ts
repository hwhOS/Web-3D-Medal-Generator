import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../domain/defaults';
import { buildMedalModel } from './medalBuilder';
import { parseSvgToPolygons } from './svgParser';

const svg = {
  fileName: 'mark.svg',
  ...parseSvgToPolygons('<svg viewBox="0 0 100 100"><path fill="#000" d="M25 25H75V75H25Z"/></svg>', {
    curveSegments: 8
  })
};

describe('buildMedalModel', () => {
  it('builds a non-empty medal mesh without SVG relief', async () => {
    const model = await buildMedalModel(defaultConfig, null);

    expect(model.vertexCount).toBeGreaterThan(0);
    expect(model.triangleCount).toBeGreaterThan(0);
    expect(model.volume).toBeGreaterThan(0);
    expect(Number.isFinite(model.positions[0])).toBe(true);
  });

  it('adds raised SVG relief as a separate model section', async () => {
    const config = { ...defaultConfig, backText: '' };
    const base = await buildMedalModel(config, null);
    const raised = await buildMedalModel(config, svg);

    expect(raised.volume).toBeGreaterThan(base.volume);
    expect(raised.reliefIndexStart).toBeGreaterThan(0);
    expect(raised.reliefIndexStart).toBeLessThan(raised.indices.length);
  });

  it('adds raised back text and optional back SVG below it', async () => {
    const base = await buildMedalModel({ ...defaultConfig, backText: '' }, null);
    const marked = await buildMedalModel(
      {
        ...defaultConfig,
        backText: 'EARNED BY TONY\nON 17 MAY 2026'
      },
      null,
      svg
    );

    expect(marked.triangleCount).toBeGreaterThan(base.triangleCount);
    expect(marked.bounds.min[2]).toBeLessThan(base.bounds.min[2]);
  });
});
