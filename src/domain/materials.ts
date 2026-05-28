import type { MaterialPreset, MedalConfig } from './types';

export interface MaterialDefinition {
  label: string;
  color: string;
  metalness: number;
  roughness: number;
}

export const materialPresets: Record<Exclude<MaterialPreset, 'custom'>, MaterialDefinition> = {
  gold: {
    label: '金色',
    color: '#d9a441',
    metalness: 0.95,
    roughness: 0.28
  },
  silver: {
    label: '银色',
    color: '#c8ccd0',
    metalness: 0.92,
    roughness: 0.22
  },
  'white-gold': {
    label: '白金',
    color: '#d8d2bf',
    metalness: 0.94,
    roughness: 0.2
  },
  'rose-gold': {
    label: '玫瑰金',
    color: '#c98f78',
    metalness: 0.93,
    roughness: 0.24
  },
  bronze: {
    label: '铜色',
    color: '#b06f3c',
    metalness: 0.86,
    roughness: 0.34
  },
  brass: {
    label: '黄铜',
    color: '#c39a42',
    metalness: 0.9,
    roughness: 0.3
  },
  platinum: {
    label: '铂金',
    color: '#e4e2db',
    metalness: 0.96,
    roughness: 0.16
  },
  titanium: {
    label: '钛金属',
    color: '#8f969c',
    metalness: 0.88,
    roughness: 0.24
  },
  'black-nickel': {
    label: '黑镍',
    color: '#24272b',
    metalness: 0.9,
    roughness: 0.18
  }
};

export function resolveMaterial(config: MedalConfig): MaterialDefinition {
  if (config.materialPreset === 'custom') {
    return {
      label: '自定义',
      color: config.color,
      metalness: config.metalness,
      roughness: config.roughness
    };
  }

  return materialPresets[config.materialPreset];
}
