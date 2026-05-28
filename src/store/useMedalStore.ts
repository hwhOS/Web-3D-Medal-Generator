import { create } from 'zustand';
import { createDefaultConfig } from '../domain/defaults';
import { materialPresets } from '../domain/materials';
import type { MaterialPreset, MedalConfig, SvgReliefInput } from '../domain/types';
import type { Language } from '../i18n';

interface MedalState {
  config: MedalConfig;
  svg: SvgReliefInput | null;
  backSvg: SvgReliefInput | null;
  language: Language;
  setConfig: (patch: Partial<MedalConfig>) => void;
  setMaterialPreset: (preset: MaterialPreset) => void;
  setLanguage: (language: Language) => void;
  setSvg: (svg: SvgReliefInput | null) => void;
  setBackSvg: (svg: SvgReliefInput | null) => void;
  reset: () => void;
}

export const useMedalStore = create<MedalState>((set) => ({
  config: createDefaultConfig(),
  svg: null,
  backSvg: null,
  language: 'en',
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
  setLanguage: (language) => set({ language }),
  setSvg: (svg) => set({ svg }),
  setBackSvg: (backSvg) => set({ backSvg }),
  reset: () =>
    set({
      config: createDefaultConfig(),
      svg: null,
      backSvg: null
    })
}));
