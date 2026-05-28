import type { SvgReliefInput } from './types';
import type { Language } from '../i18n';

export type SvgSampleId = 'apple' | 'star' | 'laurel' | 'bolt' | 'mountain' | 'crest';

export interface SvgSample {
  id: SvgSampleId;
  fileName: string;
  label: Record<Language, string>;
  text: string;
}

export const svgSamples: SvgSample[] = [
  {
    id: 'apple',
    fileName: 'apple-logo.svg',
    label: { en: 'Apple Logo', zh: 'Apple 标志' },
    text: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 814 1000"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/></svg>'
  },
  {
    id: 'star',
    fileName: 'compass-rose.svg',
    label: { en: 'Compass Rose', zh: '罗盘星芒' },
    text: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><path d="M80 8 91 55 128 32 105 69 152 80 105 91 128 128 91 105 80 152 69 105 32 128 55 91 8 80 55 69 32 32 69 55Z"/><path d="M80 36 88 70 122 80 88 90 80 124 72 90 38 80 72 70Z"/><path d="M80 57 87 73 103 80 87 87 80 103 73 87 57 80 73 73Z"/><circle cx="80" cy="80" r="7"/></svg>'
  },
  {
    id: 'laurel',
    fileName: 'laurel-wreath.svg',
    label: { en: 'Laurel Wreath', zh: '月桂花环' },
    text: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><path d="M88 30 96 54 121 54 101 69 109 94 88 79 67 94 75 69 55 54 80 54Z"/><path d="M42 132c-13-24-12-56 5-79l5 4c-15 21-16 50-4 72Z"/><path d="M138 132c13-24 12-56-5-79l-5 4c15 21 16 50 4 72Z"/><ellipse cx="48" cy="124" rx="9" ry="20" transform="rotate(-43 48 124)"/><ellipse cx="39" cy="104" rx="8" ry="18" transform="rotate(-58 39 104)"/><ellipse cx="38" cy="82" rx="8" ry="17" transform="rotate(-76 38 82)"/><ellipse cx="46" cy="61" rx="7" ry="16" transform="rotate(-116 46 61)"/><ellipse cx="58" cy="44" rx="7" ry="15" transform="rotate(-135 58 44)"/><ellipse cx="132" cy="124" rx="9" ry="20" transform="rotate(43 132 124)"/><ellipse cx="141" cy="104" rx="8" ry="18" transform="rotate(58 141 104)"/><ellipse cx="142" cy="82" rx="8" ry="17" transform="rotate(76 142 82)"/><ellipse cx="134" cy="61" rx="7" ry="16" transform="rotate(116 134 61)"/><ellipse cx="122" cy="44" rx="7" ry="15" transform="rotate(135 122 44)"/><path d="M67 126h46l-9 12 9 12H67l9-12Z"/></svg>'
  },
  {
    id: 'bolt',
    fileName: 'circuit-bolt.svg',
    label: { en: 'Circuit Bolt', zh: '电路闪电' },
    text: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><path d="M91 10 34 88h42l-16 62 68-88H88Z"/><path d="M24 28h34v10H34v28H24Z"/><path d="M112 24h24v44h-10V34h-14Z"/><path d="M22 119h34v10H32v15H22Z"/><path d="M113 110h25v11h-15v17h-10Z"/><circle cx="24" cy="28" r="8"/><circle cx="136" cy="24" r="8"/><circle cx="22" cy="144" r="8"/><circle cx="138" cy="138" r="8"/><circle cx="80" cy="82" r="9"/></svg>'
  },
  {
    id: 'mountain',
    fileName: 'alpine-emblem.svg',
    label: { en: 'Alpine Emblem', zh: '山峰徽章' },
    text: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><circle cx="138" cy="42" r="14"/><path d="M18 128 57 62 76 94 96 48 162 128Z"/><path d="M57 62 72 87 63 83 53 95 45 90Z"/><path d="M96 48 116 83 103 77 91 94 82 88Z"/><path d="M28 143c16-9 30-9 46 0s30 9 46 0 24-9 34-4v12c-12-5-21-4-34 4-16 9-30 9-46 0s-30-9-46 0Z"/><path d="M38 156c12-5 24-4 37 3s26 7 39 0 23-8 30-5v10c-9-2-17 0-27 5-15 7-30 7-45 0-11-5-21-7-34-3Z"/></svg>'
  },
  {
    id: 'crest',
    fileName: 'crowned-crest.svg',
    label: { en: 'Crowned Crest', zh: '皇冠盾徽' },
    text: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><path d="M48 48 90 30l42 18v38c0 32-18 56-42 70-24-14-42-38-42-70Z"/><path d="M50 36 66 18 82 35 90 16 98 35 114 18 130 36v13H50Z"/><path d="M70 68h40v13H70Z"/><path d="M72 93h36v13H72Z"/><path d="M90 55 98 78 122 79 103 94 110 118 90 104 70 118 77 94 58 79 82 78Z"/><path d="M58 134h64v10H58Z"/></svg>'
  }
];

export function svgSampleToInput(sample: SvgSample): SvgReliefInput {
  return {
    text: sample.text,
    fileName: sample.fileName
  };
}

export function findSvgSampleId(svg: SvgReliefInput | null): SvgSampleId | 'custom' | 'none' {
  if (!svg) {
    return 'none';
  }

  return svgSamples.find((sample) => sample.text === svg.text)?.id ?? 'custom';
}

export function getSvgSampleInput(id: SvgSampleId): SvgReliefInput {
  return svgSampleToInput(svgSamples.find((sample) => sample.id === id) ?? svgSamples[0]);
}

export function randomSvgSampleInput(): SvgReliefInput {
  return svgSampleToInput(svgSamples[Math.floor(Math.random() * svgSamples.length)]);
}
