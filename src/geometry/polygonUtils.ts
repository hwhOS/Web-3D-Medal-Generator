import type { MedalConfig } from '../domain/types';

export type Point2 = [number, number];
export type Point3 = [number, number, number];

export function polygonArea(points: Point2[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    area += x1 * y2 - x2 * y1;
  }
  return area / 2;
}

export function ensureCounterClockwise(points: Point2[]): Point2[] {
  return polygonArea(points) < 0 ? [...points].reverse() : points;
}

export function closeEnough(a: Point2, b: Point2, epsilon = 0.001): boolean {
  return Math.hypot(a[0] - b[0], a[1] - b[1]) <= epsilon;
}

export function cleanPolygon(points: Point2[], epsilon = 0.001): Point2[] {
  const cleaned: Point2[] = [];
  for (const point of points) {
    const last = cleaned.at(-1);
    if (!last || !closeEnough(last, point, epsilon)) {
      cleaned.push(point);
    }
  }

  if (cleaned.length > 1 && closeEnough(cleaned[0], cleaned.at(-1)!)) {
    cleaned.pop();
  }

  if (cleaned.length < 3 || Math.abs(polygonArea(cleaned)) < epsilon) {
    return [];
  }

  return ensureCounterClockwise(cleaned);
}

export function bounds2(polygons: Point2[][]): { min: Point2; max: Point2 } | null {
  const points = polygons.flat();
  if (points.length === 0) {
    return null;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const [x, y] of points) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  return {
    min: [minX, minY],
    max: [maxX, maxY]
  };
}

export function normalizePolygonsToMedal(
  polygons: Point2[][],
  config: MedalConfig,
  fitWidth: number,
  fitHeight: number
): Point2[][] {
  const bounds = bounds2(polygons);
  if (!bounds) {
    return [];
  }

  const sourceWidth = bounds.max[0] - bounds.min[0];
  const sourceHeight = bounds.max[1] - bounds.min[1];
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return [];
  }

  const fitScale = Math.min(fitWidth / sourceWidth, fitHeight / sourceHeight);
  const userScale = config.reliefScale / 100;
  const scale = fitScale * userScale;
  const cx = (bounds.min[0] + bounds.max[0]) / 2;
  const cy = (bounds.min[1] + bounds.max[1]) / 2;
  const radians = (config.reliefRotation * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return polygons
    .map((polygon) =>
      cleanPolygon(
        polygon.map(([x, y]) => {
          const sx = (x - cx) * scale;
          const sy = (y - cy) * scale;
          return [
            sx * cos - sy * sin + config.reliefOffsetX,
            sx * sin + sy * cos + config.reliefOffsetY
          ];
        })
      )
    )
    .filter((polygon) => polygon.length >= 3);
}

function ellipsePolygon(rx: number, ry: number, segments: number): Point2[] {
  const points: Point2[] = [];
  for (let i = 0; i < segments; i += 1) {
    const theta = (i / segments) * Math.PI * 2;
    points.push([Math.cos(theta) * rx, Math.sin(theta) * ry]);
  }
  return points;
}

function roundedRectPolygon(width: number, height: number, radius: number, cornerSegments: number): Point2[] {
  const rx = width / 2;
  const ry = height / 2;
  const r = Math.max(0, Math.min(radius, rx - 0.1, ry - 0.1));
  if (r <= 0) {
    return [
      [-rx, -ry],
      [rx, -ry],
      [rx, ry],
      [-rx, ry]
    ];
  }

  const centers: Point2[] = [
    [rx - r, ry - r],
    [-rx + r, ry - r],
    [-rx + r, -ry + r],
    [rx - r, -ry + r]
  ];
  const ranges: [number, number][] = [
    [0, Math.PI / 2],
    [Math.PI / 2, Math.PI],
    [Math.PI, (Math.PI * 3) / 2],
    [(Math.PI * 3) / 2, Math.PI * 2]
  ];

  const points: Point2[] = [];
  centers.forEach(([cx, cy], cornerIndex) => {
    const [start, end] = ranges[cornerIndex];
    for (let i = 0; i <= cornerSegments; i += 1) {
      const t = start + ((end - start) * i) / cornerSegments;
      points.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r]);
    }
  });

  return points;
}

function cubicPoint(p0: Point2, p1: Point2, p2: Point2, p3: Point2, t: number): Point2 {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  return [
    uuu * p0[0] + 3 * uu * t * p1[0] + 3 * u * tt * p2[0] + ttt * p3[0],
    uuu * p0[1] + 3 * uu * t * p1[1] + 3 * u * tt * p2[1] + ttt * p3[1]
  ];
}

function appendCubic(points: Point2[], p0: Point2, p1: Point2, p2: Point2, p3: Point2, segments: number): void {
  for (let i = 1; i <= segments; i += 1) {
    points.push(cubicPoint(p0, p1, p2, p3, i / segments));
  }
}

function roundedShieldPolygon(width: number, height: number, segments: number): Point2[] {
  const topY = height * 0.42;
  const bottomY = -height * 0.48;
  const topHalf = width * 0.39;
  const sideX = width * 0.43;
  const corner = Math.min(width, height) * 0.12;
  const cornerSegments = Math.max(8, Math.round(segments / 18));
  const sideSegments = Math.max(18, Math.round(segments / 5));
  const bottomSegments = Math.max(16, Math.round(segments / 6));

  const start: Point2 = [-topHalf + corner, topY];
  const topRight: Point2 = [topHalf - corner, topY];
  const rightUpper: Point2 = [topHalf, topY - corner];
  const rightLower: Point2 = [width * 0.31, -height * 0.33];
  const bottom: Point2 = [0, bottomY];
  const leftLower: Point2 = [-rightLower[0], rightLower[1]];
  const leftUpper: Point2 = [-rightUpper[0], rightUpper[1]];

  const points: Point2[] = [start, topRight];
  appendCubic(points, topRight, [topHalf - corner * 0.18, topY], [topHalf, topY - corner * 0.18], rightUpper, cornerSegments);
  appendCubic(
    points,
    rightUpper,
    [topHalf + width * 0.035, topY - height * 0.16],
    [sideX, -height * 0.12],
    rightLower,
    sideSegments
  );
  appendCubic(points, rightLower, [width * 0.22, -height * 0.45], [width * 0.1, bottomY], bottom, bottomSegments);
  appendCubic(points, bottom, [-width * 0.1, bottomY], [-width * 0.22, -height * 0.45], leftLower, bottomSegments);
  appendCubic(
    points,
    leftLower,
    [-sideX, -height * 0.12],
    [-topHalf - width * 0.035, topY - height * 0.16],
    leftUpper,
    sideSegments
  );
  appendCubic(points, leftUpper, [-topHalf, topY - corner * 0.18], [-topHalf + corner * 0.18, topY], start, cornerSegments);

  return cleanPolygon(points);
}

export function medalOutlinePolygon(config: MedalConfig): Point2[] {
  const segments = Math.max(24, Math.round(config.quality));

  switch (config.shape) {
    case 'circle':
      return ellipsePolygon(config.diameter / 2, config.diameter / 2, segments);
    case 'oval':
      return ellipsePolygon(config.width / 2, config.height / 2, segments);
    case 'rounded-rect':
      return roundedRectPolygon(config.width, config.height, config.cornerRadius, Math.max(4, Math.round(segments / 24)));
    case 'polygon': {
      const sides = Math.max(3, Math.round(config.polygonSides));
      const radius = Math.min(config.width, config.height) / 2;
      const points: Point2[] = [];
      for (let i = 0; i < sides; i += 1) {
        const theta = Math.PI / 2 + (i / sides) * Math.PI * 2;
        points.push([Math.cos(theta) * radius, Math.sin(theta) * radius]);
      }
      return ensureCounterClockwise(points);
    }
    case 'shield':
      return roundedShieldPolygon(config.width, config.height, segments);
    default:
      return ellipsePolygon(config.diameter / 2, config.diameter / 2, segments);
  }
}

export function scaledPolygon(points: Point2[], scale: number): Point2[] {
  return points.map(([x, y]) => [x * scale, y * scale]);
}

export function polygonMaxRadius(points: Point2[]): number {
  return Math.max(...points.map(([x, y]) => Math.hypot(x, y)));
}
