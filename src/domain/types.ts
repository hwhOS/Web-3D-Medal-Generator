export type MedalShape = 'circle' | 'oval' | 'rounded-rect' | 'polygon' | 'shield';

export type MaterialPreset =
  | 'gold'
  | 'silver'
  | 'white-gold'
  | 'rose-gold'
  | 'bronze'
  | 'brass'
  | 'platinum'
  | 'titanium'
  | 'black-nickel'
  | 'custom';

export type ExportFormat = 'stl' | 'glb' | 'usdz';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface MedalConfig {
  shape: MedalShape;
  diameter: number;
  width: number;
  height: number;
  thickness: number;
  edgeBevel: number;
  cornerRadius: number;
  polygonSides: number;
  quality: number;
  materialPreset: MaterialPreset;
  color: string;
  metalness: number;
  roughness: number;
  reliefDepth: number;
  reliefScale: number;
  reliefRotation: number;
  reliefOffsetX: number;
  reliefOffsetY: number;
  reliefColor: string;
  reliefMetalness: number;
  reliefRoughness: number;
  backText: string;
  backTextSize: number;
  backMarkDepth: number;
  backTextOffsetY: number;
  backLogoEnabled: boolean;
  backLogoWidth: number;
  backLogoOffsetY: number;
  backMarkColor: string;
  backMarkMetalness: number;
  backMarkRoughness: number;
}

export interface SvgReliefInput {
  text: string;
  fileName: string;
}

export interface SvgReliefGeometry {
  fileName: string;
  polygons: Array<Array<[number, number]>>;
  warnings: string[];
}

export interface ModelBuffers {
  positions: Float32Array;
  indices: Uint32Array;
  vertexCount: number;
  triangleCount: number;
  volume: number;
  surfaceArea: number;
  bounds: {
    min: [number, number, number];
    max: [number, number, number];
  };
  warnings: string[];
  generatedAt: number;
  reliefIndexStart?: number;
  markIndexStart?: number;
}

export interface WorkerBuildRequest {
  id: number;
  config: MedalConfig;
  svg: SvgReliefGeometry | null;
  backSvg: SvgReliefGeometry | null;
}

export type WorkerBuildResponse =
  | {
      id: number;
      ok: true;
      model: ModelBuffers;
    }
  | {
      id: number;
      ok: false;
      error: string;
      warnings: string[];
    };

export type BuildStatus = 'idle' | 'generating' | 'ready' | 'error';
