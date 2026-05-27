import Module, { type ManifoldToplevel } from 'manifold-3d';
import type { MedalConfig, ModelBuffers, SvgReliefGeometry } from '../domain/types';
import {
  bounds2,
  cleanPolygon,
  medalOutlinePolygon,
  normalizePolygonsToMedal,
  polygonMaxRadius,
  scaledPolygon,
  type Point2
} from './polygonUtils';

interface LayeredMesh {
  positions: number[];
  indices: number[];
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

function buildLayeredSolidMesh(outline: Point2[], thickness: number, edgeBevel: number): LayeredMesh {
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
  const topCenterIndex = positions.length / 3;
  positions.push(0, 0, layers.at(-1)!.z);

  for (let i = 0; i < ringSize; i += 1) {
    const next = (i + 1) % ringSize;
    indices.push(bottomCenterIndex, next, i);
  }

  const topOffset = (layers.length - 1) * ringSize;
  for (let i = 0; i < ringSize; i += 1) {
    const next = (i + 1) % ringSize;
    indices.push(topCenterIndex, topOffset + i, topOffset + next);
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
): {
  solid: ManifoldInstance;
  topOutline: Point2[];
  footprint: { width: number; height: number };
} {
  const outline = cleanPolygon(medalOutlinePolygon(config));
  const meshData = buildLayeredSolidMesh(outline, config.thickness, config.edgeBevel);
  const solid = meshToManifold(meshData, api);
  const maxRadius = Math.max(1, polygonMaxRadius(outline));
  const topScale =
    config.edgeBevel > 0.05 ? Math.max(0.65, (maxRadius - Math.min(config.edgeBevel, maxRadius * 0.25)) / maxRadius) : 1;

  return {
    solid,
    topOutline: scaledPolygon(outline, topScale * 0.92),
    footprint: modelFootprint(config)
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

function meshToBuffers(manifold: ManifoldInstance, warnings: string[]): ModelBuffers {
  const mesh = manifold.getMesh();
  const positions = new Float32Array(mesh.numVert * 3);
  for (let vertex = 0; vertex < mesh.numVert; vertex += 1) {
    const sourceOffset = vertex * mesh.numProp;
    const targetOffset = vertex * 3;
    positions[targetOffset] = mesh.vertProperties[sourceOffset];
    positions[targetOffset + 1] = mesh.vertProperties[sourceOffset + 1];
    positions[targetOffset + 2] = mesh.vertProperties[sourceOffset + 2];
  }

  return {
    positions,
    indices: new Uint32Array(mesh.triVerts),
    vertexCount: mesh.numVert,
    triangleCount: mesh.numTri,
    volume: manifold.volume(),
    surfaceArea: manifold.surfaceArea(),
    bounds: manifold.boundingBox(),
    warnings,
    generatedAt: Date.now()
  };
}

export async function buildMedalModel(config: MedalConfig, svg: SvgReliefGeometry | null, wasmUrl?: string): Promise<ModelBuffers> {
  const api = await getManifoldApi(wasmUrl);
  const warnings: string[] = [];
  const { solid: baseSolid, topOutline, footprint } = makeBase(config, api);
  let result: ManifoldInstance = baseSolid;

  try {
    if (svg?.polygons.length) {
      const { crossSection, warnings: svgWarnings } = makeReliefCrossSection(svg, config, topOutline, footprint, api);
      warnings.push(...svgWarnings);

      if (crossSection) {
        const overlap = 0.08;
        const reliefDepth = Math.max(0.1, config.reliefDepth);

        if (config.reliefMode === 'raised') {
          const reliefSolid = crossSection
            .extrude(reliefDepth + overlap, 0, 0, 1, true)
            .translate([0, 0, config.thickness / 2 + reliefDepth / 2 - overlap / 2]);
          result = result.add(reliefSolid);
          reliefSolid.delete();
        } else {
          const cutterHeight = reliefDepth + overlap * 2;
          const cutter = crossSection
            .extrude(cutterHeight, 0, 0, 1, true)
            .translate([0, 0, config.thickness / 2 - reliefDepth / 2]);
          result = result.subtract(cutter);
          cutter.delete();
        }

        crossSection.delete();
      }
    }

    const status = result.status();
    if (status !== 'NoError') {
      throw new Error(`Manifold status: ${status}`);
    }

    return meshToBuffers(result, warnings);
  } finally {
    if (result !== baseSolid) {
      baseSolid.delete();
      result.delete();
    } else {
      baseSolid.delete();
    }
  }
}
