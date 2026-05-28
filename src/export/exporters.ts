import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Mesh,
  MeshStandardMaterial,
  Scene,
  type Material,
  type Object3D
} from 'three';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import { resolveMaterial } from '../domain/materials';
import type { ExportFormat, MedalConfig, ModelBuffers } from '../domain/types';

export const exportLabels: Record<ExportFormat, string> = {
  stl: 'STL',
  glb: 'GLB',
  usdz: 'USDZ'
};

export function hasBackMarkGeometry(model: ModelBuffers): boolean {
  return typeof model.markIndexStart === 'number' && model.markIndexStart < model.indices.length;
}

export function createMedalGeometry(model: ModelBuffers, section: 'all' | 'base' | 'mark' = 'all'): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(model.positions.slice(), 3));
  const markStart = model.markIndexStart ?? model.indices.length;
  const start = section === 'mark' ? markStart : 0;
  const end = section === 'base' ? markStart : model.indices.length;
  geometry.setIndex(new BufferAttribute(model.indices.slice(start, end), 1));
  const creased = toCreasedNormals(geometry, Math.PI / 9);
  creased.computeBoundingSphere();
  geometry.dispose();
  return creased;
}

function createMaterial(config: MedalConfig): Material {
  const material = resolveMaterial(config);
  return new MeshStandardMaterial({
    color: new Color(material.color),
    metalness: material.metalness,
    roughness: material.roughness
  });
}

function createBackMarkMaterial(config: MedalConfig): Material {
  return new MeshStandardMaterial({
    color: new Color(config.backMarkColor),
    metalness: 0.08,
    roughness: 0.38
  });
}

function createExportObject(model: ModelBuffers, config: MedalConfig, unitScale: number): Object3D {
  const scene = new Scene();
  scene.name = 'medal-export';

  const medalMesh = new Mesh(createMedalGeometry(model, 'base'), createMaterial(config));
  medalMesh.name = 'custom-medal';
  medalMesh.scale.setScalar(unitScale);
  scene.add(medalMesh);

  if (hasBackMarkGeometry(model)) {
    const markMesh = new Mesh(createMedalGeometry(model, 'mark'), createBackMarkMaterial(config));
    markMesh.name = 'back-markings';
    markMesh.scale.setScalar(unitScale);
    scene.add(markMesh);
  }

  return scene;
}

export function exportFileName(format: ExportFormat): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `medal-${stamp}.${format}`;
}

export async function createExportBlob(format: ExportFormat, model: ModelBuffers, config: MedalConfig): Promise<Blob> {
  if (format === 'stl') {
    const { STLExporter } = await import('three/addons/exporters/STLExporter.js');
    const exporter = new STLExporter();
    const payload = exporter.parse(createExportObject(model, config, 1), { binary: true });
    return new Blob([payload], { type: 'model/stl' });
  }

  if (format === 'glb') {
    const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
    const exporter = new GLTFExporter();
    const payload = await exporter.parseAsync(createExportObject(model, config, 0.001), { binary: true });
    return new Blob([payload as ArrayBuffer], { type: 'model/gltf-binary' });
  }

  const { USDZExporter } = await import('three/addons/exporters/USDZExporter.js');
  const exporter = new USDZExporter();
  const payload = await exporter.parseAsync(createExportObject(model, config, 0.001), {
    quickLookCompatible: true
  });
  return new Blob([payload], { type: 'model/vnd.usdz+zip' });
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
