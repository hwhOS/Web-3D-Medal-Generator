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

  it('changes volume when relief is raised or engraved', async () => {
    const base = await buildMedalModel(defaultConfig, null);
    const raised = await buildMedalModel({ ...defaultConfig, reliefMode: 'raised' }, svg);
    const engraved = await buildMedalModel({ ...defaultConfig, reliefMode: 'engraved' }, svg);

    expect(raised.volume).toBeGreaterThan(base.volume);
    expect(engraved.volume).toBeLessThan(base.volume);
  });
});
