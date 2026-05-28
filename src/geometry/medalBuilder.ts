import Module, { type ManifoldToplevel } from 'manifold-3d';
import { BufferGeometry, Vector3 } from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import fontJson from 'three/examples/fonts/helvetiker_bold.typeface.json';
import type { MedalConfig, ModelBuffers, SvgReliefGeometry } from '../domain/types';
import {
  bounds2,
  cleanPolygon,
  medalOutlinePolygon,
  normalizePolygonsToMedal,
  polygonArea,
  polygonMaxRadius,
  scaledPolygon,
  type Point2,
  type Point3
} from './polygonUtils';

interface LayeredMesh {
  positions: number[];
  indices: number[];
}

interface BaseProfile {
  outline: Point2[];
  topRing: Point2[];
  topOutline: Point2[];
  footprint: { width: number; height: number };
}

type ManifoldApi = ManifoldToplevel;
type ManifoldInstance = InstanceType<ManifoldApi['Manifold']>;
type CrossSectionInstance = InstanceType<ManifoldApi['CrossSection']>;

let manifoldPromise: Promise<ManifoldApi> | null = null;

async function getManifoldApi(wasmUrl?: string): Promise<ManifoldApi> {
  if (!manifoldPromise) {
    manifoldPromise = Module(wasmUrl ? { locateFile: () => wasmUrl } : undefined).then((api) => {
      api.setup();
      return api;
    });
  }

  return manifoldPromise;
}

function modelFootprint(config: MedalConfig): { width: number; height: number } {
  if (config.shape === 'circle') {
    return { width: config.diameter, height: config.diameter };
  }

  if (config.shape === 'polygon') {
    const diameter = Math.min(config.width, config.height);
    return { width: diameter, height: diameter };
  }

  return { width: config.width, height: config.height };
}

function baseProfile(config: MedalConfig): BaseProfile {
  const outline = cleanPolygon(medalOutlinePolygon(config));
  const maxRadius = Math.max(1, polygonMaxRadius(outline));
  const bevel = Math.min(config.edgeBevel, config.thickness * 0.42, maxRadius * 0.25);
  const innerScale = bevel > 0 ? Math.max(0.65, (maxRadius - bevel) / maxRadius) : 1;

  return {
    outline,
    topRing: scaledPolygon(outline, innerScale),
    topOutline: scaledPolygon(outline, innerScale * 0.92),
    footprint: modelFootprint(config)
  };
}

function buildLayeredSolidMesh(outline: Point2[], thickness: number, edgeBevel: number, includeTopFace = true): LayeredMesh {
  const maxRadius = Math.max(1, polygonMaxRadius(outline));
  const half = thickness / 2;
  const bevel = Math.min(edgeBevel, thickness * 0.42, maxRadius * 0.25);
  const innerScale = bevel > 0 ? Math.max(0.65, (maxRadius - bevel) / maxRadius) : 1;
  const layers =
    bevel > 0.05
      ? [
          { z: -half, scale: innerScale },
          { z: -half + bevel, scale: 1 },
          { z: half - bevel, scale: 1 },
          { z: half, scale: innerScale }
        ]
      : [
          { z: -half, scale: 1 },
          { z: half, scale: 1 }
        ];

  const positions: number[] = [];
  const indices: number[] = [];
  const ringSize = outline.length;

  for (const layer of layers) {
    const ring = scaledPolygon(outline, layer.scale);
    for (const [x, y] of ring) {
      positions.push(x, y, layer.z);
    }
  }

  const bottomCenterIndex = positions.length / 3;
  positions.push(0, 0, layers[0].z);

  for (let i = 0; i < ringSize; i += 1) {
    const next = (i + 1) % ringSize;
    indices.push(bottomCenterIndex, next, i);
  }

  if (includeTopFace) {
    const topCenterIndex = positions.length / 3;
    positions.push(0, 0, layers.at(-1)!.z);
    const topOffset = (layers.length - 1) * ringSize;
    for (let i = 0; i < ringSize; i += 1) {
      const next = (i + 1) % ringSize;
      indices.push(topCenterIndex, topOffset + i, topOffset + next);
    }
  }

  for (let layerIndex = 0; layerIndex < layers.length - 1; layerIndex += 1) {
    const lower = layerIndex * ringSize;
    const upper = (layerIndex + 1) * ringSize;
    for (let i = 0; i < ringSize; i += 1) {
      const next = (i + 1) % ringSize;
      indices.push(lower + i, lower + next, upper + next);
      indices.push(lower + i, upper + next, upper + i);
    }
  }

  return { positions, indices };
}

function addVertex(mesh: LayeredMesh, point: Point3): number {
  const index = mesh.positions.length / 3;
  mesh.positions.push(point[0], point[1], point[2]);
  return index;
}

function addTriangle(mesh: LayeredMesh, a: Point3, b: Point3, c: Point3): void {
  mesh.indices.push(addVertex(mesh, a), addVertex(mesh, b), addVertex(mesh, c));
}

function addFlatTriangle(mesh: LayeredMesh, a: Point2, b: Point2, c: Point2, z: number, normal: 'up' | 'down'): void {
  const area = polygonArea([a, b, c]);
  const points: [Point2, Point2, Point2] = (area > 0) === (normal === 'up') ? [a, b, c] : [a, c, b];
  addTriangle(mesh, [points[0][0], points[0][1], z], [points[1][0], points[1][1], z], [points[2][0], points[2][1], z]);
}

function flattenPolygons(polygons: Point2[][]): Point2[] {
  return polygons.flatMap((polygon) => polygon);
}

function addTriangulatedSurface(
  mesh: LayeredMesh,
  polygons: Point2[][],
  z: number,
  normal: 'up' | 'down',
  api: ManifoldApi
): void {
  const points = flattenPolygons(polygons);
  if (points.length < 3) {
    return;
  }

  for (const [a, b, c] of api.triangulate(polygons)) {
    addFlatTriangle(mesh, points[a], points[b], points[c], z, normal);
  }
}

function triangulatedArea(polygons: Point2[][], api: ManifoldApi): number {
  const points = flattenPolygons(polygons);
  let area = 0;
  for (const [a, b, c] of api.triangulate(polygons)) {
    area += Math.abs(polygonArea([points[a], points[b], points[c]]));
  }
  return area;
}

function addEngravingWalls(mesh: LayeredMesh, contours: Point2[][], topZ: number, floorZ: number): void {
  addEngravingWallPairs(mesh, contours, contours, topZ, floorZ);
}

function addEngravingWallPairs(mesh: LayeredMesh, topContours: Point2[][], floorContours: Point2[][], topZ: number, floorZ: number): void {
  const count = Math.min(topContours.length, floorContours.length);
  for (let contourIndex = 0; contourIndex < count; contourIndex += 1) {
    const contour = topContours[contourIndex];
    const floorContour = floorContours[contourIndex];
    if (contour.length !== floorContour.length) {
      continue;
    }
    const isCounterClockwise = polygonArea(contour) > 0;
    for (let i = 0; i < contour.length; i += 1) {
      const a = contour[i];
      const b = contour[(i + 1) % contour.length];
      const floorA2 = floorContour[i];
      const floorB2 = floorContour[(i + 1) % floorContour.length];
      const topA: Point3 = [a[0], a[1], topZ];
      const topB: Point3 = [b[0], b[1], topZ];
      const floorA: Point3 = [floorA2[0], floorA2[1], floorZ];
      const floorB: Point3 = [floorB2[0], floorB2[1], floorZ];

      if (isCounterClockwise) {
        addTriangle(mesh, topA, topB, floorB);
        addTriangle(mesh, topA, floorB, floorA);
      } else {
        addTriangle(mesh, topA, floorB, topB);
        addTriangle(mesh, topA, floorA, floorB);
      }
    }
  }
}

function addVerticalEngravingWalls(mesh: LayeredMesh, contours: Point2[][], topZ: number, floorZ: number): void {
  for (const contour of contours) {
    const isCounterClockwise = polygonArea(contour) > 0;
    for (let i = 0; i < contour.length; i += 1) {
      const a = contour[i];
      const b = contour[(i + 1) % contour.length];
      const topA: Point3 = [a[0], a[1], topZ];
      const topB: Point3 = [b[0], b[1], topZ];
      const floorA: Point3 = [a[0], a[1], floorZ];
      const floorB: Point3 = [b[0], b[1], floorZ];

      if (isCounterClockwise) {
        addTriangle(mesh, topA, topB, floorB);
        addTriangle(mesh, topA, floorB, floorA);
      } else {
        addTriangle(mesh, topA, floorB, topB);
        addTriangle(mesh, topA, floorA, floorB);
      }
    }
  }
}

function engravingDepth(config: MedalConfig): number {
  return Math.min(Math.max(0.1, config.reliefDepth), config.thickness * 0.72);
}

function scaledContourAroundCenter(contour: Point2[], scale: number): Point2[] {
  const center = contour.reduce<Point2>((sum, [x, y]) => [sum[0] + x, sum[1] + y], [0, 0]);
  center[0] /= contour.length;
  center[1] /= contour.length;

  return contour.map(([x, y]) => [center[0] + (x - center[0]) * scale, center[1] + (y - center[1]) * scale]);
}

function beveledEngravingFloor(contours: Point2[][], config: MedalConfig): Point2[][] {
  const scale = Math.max(0.86, 1 - engravingDepth(config) * 0.22);
  return contours.map((contour) => scaledContourAroundCenter(contour, scale));
}

function buildLayeredEngravedMesh(
  outline: Point2[],
  topRing: Point2[],
  topFacePolygons: Point2[][],
  engravingPolygons: Point2[][],
  floorPolygons: Point2[][],
  config: MedalConfig,
  api: ManifoldApi
): LayeredMesh {
  const mesh = buildLayeredSolidMesh(outline, config.thickness, config.edgeBevel, false);
  const topZ = config.thickness / 2;
  const floorZ = topZ - engravingDepth(config);
  const topFace = topFacePolygons.length ? topFacePolygons : [topRing];

  addTriangulatedSurface(mesh, topFace, topZ, 'up', api);
  addTriangulatedSurface(mesh, floorPolygons, floorZ, 'up', api);
  addEngravingWallPairs(mesh, engravingPolygons, floorPolygons, topZ, floorZ);
  addVerticalEngravingWalls(mesh, engravingPolygons.filter((_, index) => engravingPolygons[index].length !== floorPolygons[index]?.length), topZ, floorZ);

  return mesh;
}

function meshToManifold(meshData: LayeredMesh, api: ManifoldApi): ManifoldInstance {
  const triVerts = new Uint32Array(meshData.indices);
  const mesh = new api.Mesh({
    numProp: 3,
    vertProperties: new Float32Array(meshData.positions),
    triVerts,
    mergeFromVert: new Uint32Array(),
    mergeToVert: new Uint32Array(),
    runIndex: new Uint32Array([0, triVerts.length]),
    runOriginalID: new Uint32Array([api.Manifold.reserveIDs(1)]),
    runTransform: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]),
    faceID: new Uint32Array()
  });

  return api.Manifold.ofMesh(mesh);
}

function makeBase(
  config: MedalConfig,
  api: ManifoldApi
): BaseProfile & {
  solid: ManifoldInstance;
} {
  const profile = baseProfile(config);
  const { outline } = profile;
  const meshData = buildLayeredSolidMesh(outline, config.thickness, config.edgeBevel);
  const solid = meshToManifold(meshData, api);

  return {
    solid,
    ...profile
  };
}

function makeReliefCrossSection(
  svg: SvgReliefGeometry,
  config: MedalConfig,
  topOutline: Point2[],
  footprint: { width: number; height: number },
  api: ManifoldApi
): { crossSection: CrossSectionInstance | null; warnings: string[] } {
  const fitWidth = footprint.width * 0.82;
  const fitHeight = footprint.height * 0.82;
  const normalized = normalizePolygonsToMedal(svg.polygons, config, fitWidth, fitHeight);
  const warnings = [...svg.warnings];

  if (normalized.length === 0) {
    return { crossSection: null, warnings };
  }

  const reliefBounds = bounds2(normalized);
  if (reliefBounds) {
    const medalBounds = bounds2([topOutline]);
    if (
      medalBounds &&
      (reliefBounds.min[0] < medalBounds.min[0] ||
        reliefBounds.max[0] > medalBounds.max[0] ||
        reliefBounds.min[1] < medalBounds.min[1] ||
        reliefBounds.max[1] > medalBounds.max[1])
    ) {
      warnings.push('部分 SVG 纹理超出奖牌正面，已按奖牌轮廓裁切。');
    }
  }

  const relief = api.CrossSection.ofPolygons(normalized, 'EvenOdd').simplify(0.03);
  const topClip = api.CrossSection.ofPolygons([topOutline], 'Positive');
  const clipped = relief.intersect(topClip).simplify(0.02);

  relief.delete();
  topClip.delete();

  if (clipped.isEmpty()) {
    clipped.delete();
    warnings.push('SVG 纹理与奖牌正面没有重叠。');
    return { crossSection: null, warnings };
  }

  return { crossSection: clipped, warnings };
}

function makeRaisedRelief(
  crossSection: CrossSectionInstance,
  config: MedalConfig
): ManifoldInstance {
  const reliefDepth = Math.max(0.1, config.reliefDepth);
  const contactInset = 0.04;
  const bevelScale = Math.max(0.94, 1 - reliefDepth * 0.06);
  const baseTop = config.thickness / 2;

  return crossSection
    .extrude(reliefDepth + contactInset, 1, 0, [bevelScale, bevelScale], false)
    .translate([0, 0, baseTop - contactInset]);
}

function meshToBuffers(manifolds: ManifoldInstance[], warnings: string[]): ModelBuffers {
  const positions: number[] = [];
  const indices: number[] = [];
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  let volume = 0;
  let surfaceArea = 0;

  for (const manifold of manifolds) {
    const mesh = manifold.getMesh();
    const vertexOffset = positions.length / 3;

    for (let vertex = 0; vertex < mesh.numVert; vertex += 1) {
      const sourceOffset = vertex * mesh.numProp;
      positions.push(
        mesh.vertProperties[sourceOffset],
        mesh.vertProperties[sourceOffset + 1],
        mesh.vertProperties[sourceOffset + 2]
      );
    }

    for (const index of mesh.triVerts) {
      indices.push(index + vertexOffset);
    }

    const bounds = manifold.boundingBox();
    for (let axis = 0; axis < 3; axis += 1) {
      min[axis] = Math.min(min[axis], bounds.min[axis]);
      max[axis] = Math.max(max[axis], bounds.max[axis]);
    }

    volume += manifold.volume();
    surfaceArea += manifold.surfaceArea();
  }

  return {
    positions: new Float32Array(positions),
    indices: new Uint32Array(indices),
    vertexCount: positions.length / 3,
    triangleCount: indices.length / 3,
    volume,
    surfaceArea,
    bounds: { min, max },
    warnings,
    generatedAt: Date.now()
  };
}

function meshDataToBuffers(mesh: LayeredMesh, warnings: string[], volumeOverride?: number): ModelBuffers {
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  let signedVolume = 0;
  let surfaceArea = 0;

  for (let i = 0; i < mesh.positions.length; i += 3) {
    const x = mesh.positions[i];
    const y = mesh.positions[i + 1];
    const z = mesh.positions[i + 2];
    min[0] = Math.min(min[0], x);
    min[1] = Math.min(min[1], y);
    min[2] = Math.min(min[2], z);
    max[0] = Math.max(max[0], x);
    max[1] = Math.max(max[1], y);
    max[2] = Math.max(max[2], z);
  }

  for (let i = 0; i < mesh.indices.length; i += 3) {
    const ia = mesh.indices[i] * 3;
    const ib = mesh.indices[i + 1] * 3;
    const ic = mesh.indices[i + 2] * 3;
    const ax = mesh.positions[ia];
    const ay = mesh.positions[ia + 1];
    const az = mesh.positions[ia + 2];
    const bx = mesh.positions[ib];
    const by = mesh.positions[ib + 1];
    const bz = mesh.positions[ib + 2];
    const cx = mesh.positions[ic];
    const cy = mesh.positions[ic + 1];
    const cz = mesh.positions[ic + 2];
    const abx = bx - ax;
    const aby = by - ay;
    const abz = bz - az;
    const acx = cx - ax;
    const acy = cy - ay;
    const acz = cz - az;
    const crossX = aby * acz - abz * acy;
    const crossY = abz * acx - abx * acz;
    const crossZ = abx * acy - aby * acx;

    surfaceArea += Math.hypot(crossX, crossY, crossZ) / 2;
    signedVolume += (ax * (by * cz - bz * cy) + ay * (bz * cx - bx * cz) + az * (bx * cy - by * cx)) / 6;
  }

  return {
    positions: new Float32Array(mesh.positions),
    indices: new Uint32Array(mesh.indices),
    vertexCount: mesh.positions.length / 3,
    triangleCount: mesh.indices.length / 3,
    volume: volumeOverride ?? Math.abs(signedVolume),
    surfaceArea,
    bounds: { min, max },
    warnings,
    generatedAt: Date.now()
  };
}

function cleanedPolygons(polygons: Point2[][]): Point2[][] {
  return polygons.map((polygon) => cleanPolygon(polygon, 0.00001)).filter((polygon) => polygon.length >= 3);
}

function meshFromManifold(manifold: ManifoldInstance): LayeredMesh {
  const mesh = manifold.getMesh();
  const positions: number[] = [];
  const indices: number[] = [];

  for (let vertex = 0; vertex < mesh.numVert; vertex += 1) {
    const sourceOffset = vertex * mesh.numProp;
    positions.push(mesh.vertProperties[sourceOffset], mesh.vertProperties[sourceOffset + 1], mesh.vertProperties[sourceOffset + 2]);
  }

  for (const index of mesh.triVerts) {
    indices.push(index);
  }

  return { positions, indices };
}

function appendMeshToModel(model: ModelBuffers, mesh: LayeredMesh): ModelBuffers {
  if (mesh.positions.length === 0 || mesh.indices.length === 0) {
    return model;
  }

  const meshModel = meshDataToBuffers(mesh, []);
  const vertexOffset = model.positions.length / 3;
  const positions = new Float32Array(model.positions.length + meshModel.positions.length);
  const indices = new Uint32Array(model.indices.length + meshModel.indices.length);

  positions.set(model.positions);
  positions.set(meshModel.positions, model.positions.length);
  indices.set(model.indices);
  for (let i = 0; i < meshModel.indices.length; i += 1) {
    indices[model.indices.length + i] = meshModel.indices[i] + vertexOffset;
  }

  return {
    positions,
    indices,
    vertexCount: positions.length / 3,
    triangleCount: indices.length / 3,
    volume: model.volume + meshModel.volume,
    surfaceArea: model.surfaceArea + meshModel.surfaceArea,
    bounds: {
      min: [
        Math.min(model.bounds.min[0], meshModel.bounds.min[0]),
        Math.min(model.bounds.min[1], meshModel.bounds.min[1]),
        Math.min(model.bounds.min[2], meshModel.bounds.min[2])
      ],
      max: [
        Math.max(model.bounds.max[0], meshModel.bounds.max[0]),
        Math.max(model.bounds.max[1], meshModel.bounds.max[1]),
        Math.max(model.bounds.max[2], meshModel.bounds.max[2])
      ]
    },
    warnings: model.warnings,
    generatedAt: Date.now(),
    markIndexStart: model.markIndexStart ?? model.indices.length
  };
}

function normalizeBackSvgPolygons(svg: SvgReliefGeometry, config: MedalConfig): Point2[][] {
  const bounds = bounds2(svg.polygons);
  if (!bounds) {
    return [];
  }

  const sourceWidth = bounds.max[0] - bounds.min[0];
  const sourceHeight = bounds.max[1] - bounds.min[1];
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return [];
  }

  const scale = config.backLogoWidth / sourceWidth;
  const centerX = (bounds.min[0] + bounds.max[0]) / 2;
  const centerY = (bounds.min[1] + bounds.max[1]) / 2;

  return svg.polygons
    .map((polygon) =>
      cleanPolygon(
        polygon.map(([x, y]) => [-(x - centerX) * scale, (y - centerY) * scale + config.backLogoOffsetY])
      )
    )
    .filter((polygon) => polygon.length >= 3);
}

function makeBackSvgMesh(
  svg: SvgReliefGeometry | null,
  config: MedalConfig,
  profile: BaseProfile,
  warnings: string[],
  api: ManifoldApi
): LayeredMesh | null {
  if (!svg || !config.backLogoEnabled) {
    return null;
  }

  warnings.push(...svg.warnings);
  const normalized = normalizeBackSvgPolygons(svg, config);
  if (normalized.length === 0) {
    return null;
  }

  const relief = api.CrossSection.ofPolygons(normalized, 'EvenOdd').simplify(0.03);
  const backClip = api.CrossSection.ofPolygons([profile.topOutline], 'Positive');
  const clipped = relief.intersect(backClip).simplify(0.02);
  relief.delete();
  backClip.delete();

  if (clipped.isEmpty()) {
    clipped.delete();
    warnings.push('背面 SVG 与奖牌背面没有重叠。');
    return null;
  }

  const depth = Math.min(Math.max(0.05, config.backMarkDepth), config.thickness * 0.28);
  const contactInset = 0.035;
  const bevelScale = Math.max(0.94, 1 - depth * 0.08);
  const solid = clipped
    .extrude(depth + contactInset, 1, 0, [bevelScale, bevelScale], false)
    .scale([1, 1, -1])
    .translate([0, 0, -config.thickness / 2 + contactInset]);
  const mesh = meshFromManifold(solid);

  clipped.delete();
  solid.delete();

  return mesh;
}

let cachedFont: ReturnType<FontLoader['parse']> | null = null;

function getTextFont(): ReturnType<FontLoader['parse']> {
  cachedFont ??= new FontLoader().parse(fontJson);
  return cachedFont;
}

function appendTransformedGeometry(mesh: LayeredMesh, geometry: BufferGeometry, transform: (point: Vector3) => Point3): void {
  const position = geometry.getAttribute('position');
  if (!position) {
    return;
  }

  const index = geometry.getIndex();
  const vertexOffset = mesh.positions.length / 3;
  const transformed: Point3[] = [];

  for (let i = 0; i < position.count; i += 1) {
    transformed.push(transform(new Vector3(position.getX(i), position.getY(i), position.getZ(i))));
  }

  for (const point of transformed) {
    mesh.positions.push(point[0], point[1], point[2]);
  }

  if (index) {
    for (let i = 0; i < index.count; i += 1) {
      mesh.indices.push(vertexOffset + index.getX(i));
    }
  } else {
    for (let i = 0; i < transformed.length; i += 1) {
      mesh.indices.push(vertexOffset + i);
    }
  }
}

function makeBackTextMesh(config: MedalConfig, profile: BaseProfile): LayeredMesh | null {
  const lines = config.backText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4);

  if (lines.length === 0) {
    return null;
  }

  const font = getTextFont();
  const depth = Math.min(Math.max(0.05, config.backMarkDepth), config.thickness * 0.28);
  const contactInset = 0.035;
  const textDepth = depth + contactInset;
  const size = Math.max(0.8, config.backTextSize);
  const lineGap = size * 1.32;
  const geometries = lines.map(
    (line) =>
      new TextGeometry(line, {
        font,
        size,
        depth: textDepth,
        curveSegments: 3,
        bevelEnabled: false
      })
  );

  const widths = geometries.map((geometry) => {
    geometry.computeBoundingBox();
    return (geometry.boundingBox?.max.x ?? 0) - (geometry.boundingBox?.min.x ?? 0);
  });
  const maxWidth = Math.max(...widths, 1);
  const maxAllowedWidth = Math.min(profile.footprint.width, profile.footprint.height) * 0.64;
  const fitScale = Math.min(1, maxAllowedWidth / maxWidth);
  const mesh: LayeredMesh = { positions: [], indices: [] };
  const backZ = -config.thickness / 2;
  const totalHeight = (lines.length - 1) * lineGap * fitScale + size * fitScale;

  geometries.forEach((geometry, lineIndex) => {
    const bounds = geometry.boundingBox;
    const width = widths[lineIndex];
    const minX = bounds?.min.x ?? 0;
    const minY = bounds?.min.y ?? 0;
    const lineY = config.backTextOffsetY + totalHeight / 2 - size * fitScale - lineIndex * lineGap * fitScale;

    appendTransformedGeometry(mesh, geometry, (point) => [
      -(point.x - minX - width / 2) * fitScale,
      (point.y - minY) * fitScale + lineY,
      backZ + contactInset - point.z
    ]);
    geometry.dispose();
  });

  return mesh;
}

function applyBackMarks(
  model: ModelBuffers,
  profile: BaseProfile,
  config: MedalConfig,
  backSvg: SvgReliefGeometry | null,
  warnings: string[],
  api: ManifoldApi
): ModelBuffers {
  let nextModel = model;
  const textMesh = makeBackTextMesh(config, profile);
  if (textMesh) {
    nextModel = appendMeshToModel(nextModel, textMesh);
  }

  const backSvgMesh = makeBackSvgMesh(backSvg, config, profile, warnings, api);
  if (backSvgMesh) {
    nextModel = appendMeshToModel(nextModel, backSvgMesh);
  }

  return {
    ...nextModel,
    warnings
  };
}

function makeEngravedBuffers(
  profile: BaseProfile,
  crossSection: CrossSectionInstance,
  config: MedalConfig,
  warnings: string[],
  baseVolume: number,
  api: ManifoldApi
): ModelBuffers | null {
  const topSurface = api.CrossSection.ofPolygons([profile.topRing], 'Positive');
  const engraving = crossSection.intersect(topSurface).simplify(0.02);

  if (engraving.isEmpty()) {
    topSurface.delete();
    engraving.delete();
    return null;
  }

  const remainingTop = topSurface.subtract(engraving).simplify(0.02);
  const topFacePolygons = cleanedPolygons(remainingTop.toPolygons() as Point2[][]);
  const engravingPolygons = cleanedPolygons(engraving.toPolygons() as Point2[][]);

  topSurface.delete();
  remainingTop.delete();
  engraving.delete();

  if (engravingPolygons.length === 0) {
    return null;
  }

  const removedVolume = triangulatedArea(engravingPolygons, api) * engravingDepth(config);
  const volume = Math.max(0, baseVolume - removedVolume);
  const floorPolygons = beveledEngravingFloor(engravingPolygons, config);
  const mesh = buildLayeredEngravedMesh(profile.outline, profile.topRing, topFacePolygons, engravingPolygons, floorPolygons, config, api);

  return meshDataToBuffers(mesh, warnings, volume);
}

export async function buildMedalModel(
  config: MedalConfig,
  svg: SvgReliefGeometry | null,
  backSvg: SvgReliefGeometry | null = null,
  wasmUrl?: string
): Promise<ModelBuffers> {
  const api = await getManifoldApi(wasmUrl);
  const warnings: string[] = [];
  const { solid: baseSolid, ...profile } = makeBase(config, api);
  let result: ManifoldInstance = baseSolid;
  let raisedRelief: ManifoldInstance | null = null;
  let engravedModel: ModelBuffers | null = null;

  try {
    if (svg?.polygons.length) {
      const { crossSection, warnings: svgWarnings } = makeReliefCrossSection(svg, config, profile.topOutline, profile.footprint, api);
      warnings.push(...svgWarnings);

      if (crossSection) {
        if (config.reliefMode === 'raised') {
          // Keep raised artwork as its own shell to avoid CSG remeshing artifacts on the medal face.
          raisedRelief = makeRaisedRelief(crossSection, config);
        } else {
          // Build engraved grooves directly instead of using CSG subtraction, which creates visible long-triangle artifacts.
          engravedModel = makeEngravedBuffers(profile, crossSection, config, warnings, baseSolid.volume(), api);
        }

        crossSection.delete();
      }
    }

    let model: ModelBuffers;

    if (engravedModel) {
      model = engravedModel;
    } else {
      const outputSolids = result === baseSolid && raisedRelief ? [baseSolid, raisedRelief] : [result];
      for (const solid of outputSolids) {
        const status = solid.status();
        if (status !== 'NoError') {
          throw new Error(`Manifold status: ${status}`);
        }
      }
      model = meshToBuffers(outputSolids, warnings);
    }

    return applyBackMarks(model, profile, config, backSvg, warnings, api);
  } finally {
    if (raisedRelief) {
      raisedRelief.delete();
    }

    if (result !== baseSolid) {
      baseSolid.delete();
      result.delete();
    } else {
      baseSolid.delete();
    }
  }
}
