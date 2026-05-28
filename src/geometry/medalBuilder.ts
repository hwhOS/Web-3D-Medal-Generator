import Module, { type ManifoldToplevel } from 'manifold-3d';
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

function buildLayeredEngravedMesh(
  outline: Point2[],
  topRing: Point2[],
  topFacePolygons: Point2[][],
  engravingPolygons: Point2[][],
  config: MedalConfig,
  api: ManifoldApi
): LayeredMesh {
  const mesh = buildLayeredSolidMesh(outline, config.thickness, config.edgeBevel, false);
  const topZ = config.thickness / 2;
  const floorZ = topZ - engravingDepth(config);
  const topFace = topFacePolygons.length ? topFacePolygons : [topRing];

  addTriangulatedSurface(mesh, topFace, topZ, 'up', api);
  addTriangulatedSurface(mesh, engravingPolygons, floorZ, 'up', api);
  addEngravingWalls(mesh, engravingPolygons, topZ, floorZ);

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
  const mesh = buildLayeredEngravedMesh(profile.outline, profile.topRing, topFacePolygons, engravingPolygons, config, api);

  return meshDataToBuffers(mesh, warnings, volume);
}

export async function buildMedalModel(config: MedalConfig, svg: SvgReliefGeometry | null, wasmUrl?: string): Promise<ModelBuffers> {
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

    if (engravedModel) {
      return engravedModel;
    }

    const outputSolids = result === baseSolid && raisedRelief ? [baseSolid, raisedRelief] : [result];
    for (const solid of outputSolids) {
      const status = solid.status();
      if (status !== 'NoError') {
        throw new Error(`Manifold status: ${status}`);
      }
    }

    return meshToBuffers(outputSolids, warnings);
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
