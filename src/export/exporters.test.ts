import { describe, expect, it, vi } from 'vitest';
import { defaultConfig } from '../domain/defaults';
import type { ExportFormat, ModelBuffers } from '../domain/types';
import { createExportBlob, exportFileName } from './exporters';

vi.mock('three/addons/exporters/STLExporter.js', () => ({
  STLExporter: class {
    parse() {
      return new ArrayBuffer(16);
    }
  }
}));

vi.mock('three/addons/exporters/GLTFExporter.js', () => ({
  GLTFExporter: class {
    parseAsync() {
      return Promise.resolve(new ArrayBuffer(24));
    }
  }
}));

vi.mock('three/addons/exporters/USDZExporter.js', () => ({
  USDZExporter: class {
    parseAsync() {
      return Promise.resolve(new ArrayBuffer(32));
    }
  }
}));

const model: ModelBuffers = {
  positions: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
  indices: new Uint32Array([0, 1, 2]),
  vertexCount: 3,
  triangleCount: 1,
  volume: 1,
  surfaceArea: 1,
  bounds: { min: [0, 0, 0], max: [1, 1, 0] },
  warnings: [],
  generatedAt: 0
};

describe('exporters', () => {
  it.each(['stl', 'glb', 'usdz'] satisfies ExportFormat[])('creates a %s blob', async (format) => {
    const blob = await createExportBlob(format, model, defaultConfig);

    expect(blob.size).toBeGreaterThan(0);
    expect(exportFileName(format)).toMatch(new RegExp(`\\.${format}$`));
  });
});
