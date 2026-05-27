import { describe, expect, it } from 'vitest';
import { parseSvgToPolygons } from './svgParser';

describe('parseSvgToPolygons', () => {
  it('extracts filled SVG paths as polygons', () => {
    const svg = '<svg viewBox="0 0 100 100"><path fill="#000" d="M10 10H90V90H10Z"/></svg>';
    const parsed = parseSvgToPolygons(svg, { curveSegments: 8 });

    expect(parsed.polygons.length).toBeGreaterThan(0);
    expect(parsed.warnings).toHaveLength(0);
  });

  it('reports unsupported SVG features', () => {
    const svg = '<svg><script>alert(1)</script><image href="https://example.test/a.png" /></svg>';
    const parsed = parseSvgToPolygons(svg, { curveSegments: 8 });

    expect(parsed.warnings.some((warning) => warning.includes('script'))).toBe(true);
    expect(parsed.warnings.some((warning) => warning.includes('外链'))).toBe(true);
  });
});
