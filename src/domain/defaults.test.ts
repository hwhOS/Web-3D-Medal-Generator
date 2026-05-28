import { describe, expect, it } from 'vitest';
import { createDefaultBackText, createDefaultConfig, defaultConfig } from './defaults';
import { resolveMaterial } from './materials';

describe('defaultConfig', () => {
  it('starts with printable medal dimensions and a metallic material', () => {
    expect(defaultConfig.thickness).toBeGreaterThan(0);
    expect(defaultConfig.diameter).toBeGreaterThan(defaultConfig.thickness);
    expect(defaultConfig.reliefDepth).toBe(0.1);
    expect(defaultConfig.backMarkDepth).toBe(0.1);
    expect(defaultConfig.quality).toBeGreaterThanOrEqual(144);
    expect(defaultConfig.reliefMetalness).toBeGreaterThan(0.8);
    expect(defaultConfig.materialPreset).toBe('silver');
    expect(defaultConfig.reliefColor).toBe('#c8ccd0');
    expect(defaultConfig.reliefRoughness).toBe(0);
    expect(defaultConfig.backMarkRoughness).toBe(0);
    expect(resolveMaterial(defaultConfig).metalness).toBeGreaterThan(0.8);
  });

  it('formats the default back text with the current date style', () => {
    expect(createDefaultBackText(new Date(2026, 4, 28))).toBe('EARNED BY TONY\nON 28 MAY 2026');
    expect(createDefaultConfig(new Date(2026, 4, 28)).backText).toBe('EARNED BY TONY\nON 28 MAY 2026');
  });
});
