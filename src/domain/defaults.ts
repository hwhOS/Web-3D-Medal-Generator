import type { MedalConfig } from './types';
import { materialPresets } from './materials';

const monthNames = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

export function formatBackTextDate(date = new Date()): string {
  return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

export function createDefaultBackText(date = new Date()): string {
  return `EARNED BY TONY\nON ${formatBackTextDate(date)}`;
}

export function createDefaultConfig(date = new Date()): MedalConfig {
  const silver = materialPresets.silver;

  return {
    shape: 'circle',
    diameter: 72,
    width: 72,
    height: 72,
    thickness: 5,
    edgeBevel: 1,
    cornerRadius: 8,
    polygonSides: 6,
    quality: 144,
    materialPreset: 'silver',
    color: silver.color,
    metalness: silver.metalness,
    roughness: silver.roughness,
    reliefDepth: 0.45,
    reliefScale: 52,
    reliefRotation: 0,
    reliefOffsetX: 0,
    reliefOffsetY: 0,
    reliefColor: silver.color,
    reliefMetalness: silver.metalness,
    reliefRoughness: 0,
    backText: createDefaultBackText(date),
    backTextSize: 3.2,
    backMarkDepth: 0.35,
    backTextOffsetY: 5,
    backLogoEnabled: true,
    backLogoWidth: 8,
    backLogoOffsetY: -7,
    backMarkColor: '#ffffff',
    backMarkMetalness: 0.08,
    backMarkRoughness: 0
  };
}

export const defaultConfig: MedalConfig = createDefaultConfig();
