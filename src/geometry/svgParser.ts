import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import type { Shape, ShapePath, Path } from 'three';
import { cleanPolygon, type Point2 } from './polygonUtils';

export interface ParsedSvgRelief {
  polygons: Point2[][];
  warnings: string[];
}

interface ParseOptions {
  curveSegments: number;
}

const unsupportedPatterns: Array<[RegExp, string]> = [
  [/<script[\s>]/i, '已忽略 SVG 中的 script。'],
  [/<image[\s>]/i, '已忽略 SVG 中的位图 image；请使用矢量路径。'],
  [/<filter[\s>]/i, '已忽略 SVG filter，建模只使用路径轮廓。'],
  [/<animate[\s>]/i, '已忽略 SVG animation。'],
  [/\b(?:href|xlink:href)=["']https?:\/\//i, '已忽略外链资源。']
];

function styleNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function hasPaint(value: unknown): boolean {
  return typeof value === 'string' && value !== '' && value !== 'none' && value !== 'transparent';
}

function shapeToPolygons(shape: Shape, curveSegments: number): Point2[][] {
  const contours: Point2[][] = [];
  const outer = cleanPolygon(shape.getPoints(curveSegments).map(({ x, y }) => [x, -y]));
  if (outer.length >= 3) {
    contours.push(outer);
  }

  for (const hole of shape.holes) {
    const holePolygon = cleanPolygon(hole.getPoints(curveSegments).map(({ x, y }) => [x, -y]));
    if (holePolygon.length >= 3) {
      contours.push(holePolygon);
    }
  }

  return contours;
}

function strokeSegmentToPolygon(a: Point2, b: Point2, width: number): Point2[] {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const length = Math.hypot(dx, dy);
  if (length <= 0.0001) {
    return [];
  }

  const nx = (-dy / length) * (width / 2);
  const ny = (dx / length) * (width / 2);
  return cleanPolygon([
    [a[0] + nx, a[1] + ny],
    [b[0] + nx, b[1] + ny],
    [b[0] - nx, b[1] - ny],
    [a[0] - nx, a[1] - ny]
  ]);
}

function strokePathToPolygons(path: ShapePath, curveSegments: number, strokeWidth: number): Point2[][] {
  const polygons: Point2[][] = [];
  const subPaths = (path as ShapePath & { subPaths?: Path[] }).subPaths ?? [];

  for (const subPath of subPaths) {
    const points = subPath.getPoints(curveSegments).map(({ x, y }) => [x, -y] as Point2);
    for (let i = 0; i < points.length - 1; i += 1) {
      const polygon = strokeSegmentToPolygon(points[i], points[i + 1], strokeWidth);
      if (polygon.length >= 3) {
        polygons.push(polygon);
      }
    }
  }

  return polygons;
}

export function parseSvgToPolygons(svgText: string, options: ParseOptions): ParsedSvgRelief {
  const warnings: string[] = [];
  for (const [pattern, message] of unsupportedPatterns) {
    if (pattern.test(svgText)) {
      warnings.push(message);
    }
  }

  const loader = new SVGLoader();
  const data = loader.parse(svgText);
  const polygons: Point2[][] = [];

  for (const path of data.paths) {
    const style = path.userData?.style ?? {};
    const fillOpacity = styleNumber(style.fillOpacity, 1);
    const strokeOpacity = styleNumber(style.strokeOpacity, 1);
    const strokeWidth = Math.max(0, styleNumber(style.strokeWidth, 1));
    const fill = style.fill;
    const stroke = style.stroke;

    if (hasPaint(fill) && fillOpacity > 0) {
      const shapes = SVGLoader.createShapes(path);
      for (const shape of shapes) {
        polygons.push(...shapeToPolygons(shape, options.curveSegments));
      }
    }

    if (hasPaint(stroke) && strokeOpacity > 0 && strokeWidth > 0) {
      polygons.push(...strokePathToPolygons(path, options.curveSegments, strokeWidth));
    }
  }

  if (polygons.length === 0) {
    warnings.push('没有从 SVG 中找到可建模的填充或描边路径。');
  }

  return { polygons, warnings };
}
