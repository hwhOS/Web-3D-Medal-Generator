import { describe, expect, it } from 'vitest';
import { defaultConfig } from './defaults';
import { resolveMaterial } from './materials';

describe('defaultConfig', () => {
  it('starts with printable medal dimensions and a metallic material', () => {
    expect(defaultConfig.thickness).toBeGreaterThan(0);
    expect(defaultConfig.diameter).toBeGreaterThan(defaultConfig.thickness);
    expect(defaultConfig.reliefDepth).toBeGreaterThan(0);
    expect(resolveMaterial(defaultConfig).metalness).toBeGreaterThan(0.8);
  });
});
