import { create } from 'zustand';
import { defaultConfig } from '../domain/defaults';
import { materialPresets } from '../domain/materials';
import type { MaterialPreset, MedalConfig, SvgReliefInput } from '../domain/types';

interface MedalState {
  config: MedalConfig;
  svg: SvgReliefInput | null;
  backSvg: SvgReliefInput | null;
  setConfig: (patch: Partial<MedalConfig>) => void;
  setMaterialPreset: (preset: MaterialPreset) => void;
  setSvg: (svg: SvgReliefInput | null) => void;
  setBackSvg: (svg: SvgReliefInput | null) => void;
  reset: () => void;
}

export const useMedalStore = create<MedalState>((set) => ({
  config: defaultConfig,
  svg: null,
  backSvg: null,
  setConfig: (patch) =>
    set((state) => ({
      config: {
        ...state.config,
        ...patch
      }
    })),
  setMaterialPreset: (preset) =>
    set((state) => {
      if (preset === 'custom') {
        return {
          config: {
            ...state.config,
            materialPreset: preset
          }
        };
      }

      return {
        config: {
          ...state.config,
          materialPreset: preset,
          color: materialPresets[preset].color,
          metalness: materialPresets[preset].metalness,
          roughness: materialPresets[preset].roughness
        }
      };
    }),
  setSvg: (svg) => set({ svg }),
  setBackSvg: (backSvg) => set({ backSvg }),
  reset: () =>
    set({
      config: defaultConfig,
      svg: null,
      backSvg: null
    })
}));
