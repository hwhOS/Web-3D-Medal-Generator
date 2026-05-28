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

const gapSvg = {
  fileName: 'gap-mark.svg',
  ...parseSvgToPolygons('<svg viewBox="0 0 100 100"><path fill="#000" d="M20 20H38V80H20Z M62 20H80V80H62Z"/></svg>', {
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

  it('can raise the empty space inside the SVG artwork bounds', async () => {
    const config = { ...defaultConfig, backText: '', reliefInvert: true };
    const base = await buildMedalModel(config, null);
    const inverted = await buildMedalModel(config, gapSvg);

    expect(inverted.volume).toBeGreaterThan(base.volume);
    expect(inverted.reliefIndexStart).toBeGreaterThan(0);
    expect(inverted.reliefIndexStart).toBeLessThan(inverted.indices.length);
    expect(inverted.warnings).not.toContain('SVG 外接框内没有可凸显的空白区域。');
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

  it('keeps offset back SVG bevels centered on the SVG artwork', async () => {
    const marked = await buildMedalModel(
      {
        ...defaultConfig,
        backText: '',
        backLogoOffsetY: -14,
        backMarkDepth: 1
      },
      null,
      svg
    );
    const markStart = marked.markIndexStart ?? marked.indices.length;
    const markVertexIds = new Set<number>();

    for (let i = markStart; i < marked.indices.length; i += 1) {
      markVertexIds.add(marked.indices[i]);
    }

    const vertices = Array.from(markVertexIds).map((vertexId) => ({
      x: marked.positions[vertexId * 3],
      y: marked.positions[vertexId * 3 + 1],
      z: marked.positions[vertexId * 3 + 2]
    }));
    const minZ = Math.min(...vertices.map((point) => point.z));
    const maxZ = Math.max(...vertices.map((point) => point.z));
    const centroidAtZ = (z: number) => {
      const points = vertices.filter((point) => Math.abs(point.z - z) < 0.005);
      expect(points.length).toBeGreaterThan(0);
      return points.reduce(
        (sum, point) => ({ x: sum.x + point.x / points.length, y: sum.y + point.y / points.length }),
        { x: 0, y: 0 }
      );
    };

    const outerFace = centroidAtZ(minZ);
    const contactFace = centroidAtZ(maxZ);

    expect(outerFace.x).toBeCloseTo(contactFace.x, 1);
    expect(outerFace.y).toBeCloseTo(contactFace.y, 1);
  });
});
