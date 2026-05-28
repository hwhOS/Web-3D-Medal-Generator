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
    fileName: 'star-medal.svg',
    label: { en: 'Five Point Star', zh: '五角星' },
    text: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 6 61.4 37.2 94 38.2 68.2 58.5 77.3 90 50 72.1 22.7 90 31.8 58.5 6 38.2 38.6 37.2Z"/></svg>'
  },
  {
    id: 'laurel',
    fileName: 'laurel-wreath.svg',
    label: { en: 'Laurel Wreath', zh: '月桂花环' },
    text: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><g><ellipse cx="34" cy="88" rx="8" ry="17" transform="rotate(-38 34 88)"/><ellipse cx="26" cy="70" rx="7" ry="15" transform="rotate(-55 26 70)"/><ellipse cx="27" cy="51" rx="6" ry="14" transform="rotate(-70 27 51)"/><ellipse cx="36" cy="34" rx="6" ry="13" transform="rotate(-30 36 34)"/><ellipse cx="86" cy="88" rx="8" ry="17" transform="rotate(38 86 88)"/><ellipse cx="94" cy="70" rx="7" ry="15" transform="rotate(55 94 70)"/><ellipse cx="93" cy="51" rx="6" ry="14" transform="rotate(70 93 51)"/><ellipse cx="84" cy="34" rx="6" ry="13" transform="rotate(30 84 34)"/><path d="M60 20 68 44 94 44 73 59 81 84 60 69 39 84 47 59 26 44 52 44Z"/></g></svg>'
  },
  {
    id: 'bolt',
    fileName: 'lightning-bolt.svg',
    label: { en: 'Lightning Bolt', zh: '闪电' },
    text: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M56 4 18 56h28L36 96 82 40H54Z"/></svg>'
  },
  {
    id: 'mountain',
    fileName: 'mountain-badge.svg',
    label: { en: 'Mountain Badge', zh: '山峰徽章' },
    text: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><path d="M12 88 43 34 58 60 72 42 108 88Z"/><path d="M43 34 55 55 48 52 39 61 33 58Z"/><path d="M72 42 85 64 75 58 67 65 62 62Z"/></svg>'
  },
  {
    id: 'crest',
    fileName: 'shield-crest.svg',
    label: { en: 'Shield Crest', zh: '盾徽' },
    text: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><path d="M60 8 96 22v30c0 29-16 49-36 60-20-11-36-31-36-60V22Z"/><path d="M60 24 68 49h26L73 64l8 25-21-15-21 15 8-25-21-15h26Z"/></svg>'
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
