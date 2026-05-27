import type { MedalConfig } from './types';

export const defaultConfig: MedalConfig = {
  shape: 'circle',
  diameter: 72,
  width: 72,
  height: 72,
  thickness: 5,
  edgeBevel: 1,
  cornerRadius: 8,
  polygonSides: 6,
  quality: 96,
  materialPreset: 'gold',
  color: '#d9a441',
  metalness: 0.95,
  roughness: 0.28,
  reliefMode: 'raised',
  reliefDepth: 1.2,
  reliefScale: 74,
  reliefRotation: 0,
  reliefOffsetX: 0,
  reliefOffsetY: 0
};
