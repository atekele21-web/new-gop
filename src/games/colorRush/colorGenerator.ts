/**
 * Color Rush - Progressive Reaction Color Generator
 * Calibrated for a 10-round tournament reaction session.
 * 
 * Round-by-Round Progression:
 * - Rounds 1-2: 4 large targets, distinct vibrant hues (45-80° hue delta), 3.5s timer
 * - Rounds 3-4: 4 large targets, medium hue separation (30-50° delta), 3.0s timer
 * - Rounds 5-6: 6 large targets, closer chromatic tones (20-35° delta), 2.5s timer
 * - Rounds 7-8: 6 large targets, subtle tone variance (14-24° delta), 2.0s timer
 * - Rounds 9-10: 6 large targets, refined micro-chromatic variance (8-16° delta), 1.6s timer
 */

import { ColorItem } from './types';

// Convert HSL (0-360, 0-100, 0-100) to standard Hex string
export function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// 8 Vivid Palette Anchors for rich, high-fidelity target color themes
const PALETTES = [
  { name: 'Crimson Red', hueRange: [345, 15] },
  { name: 'Solar Orange', hueRange: [24, 45] },
  { name: 'Amber Gold', hueRange: [48, 65] },
  { name: 'Emerald Green', hueRange: [125, 155] },
  { name: 'Cyan Aqua', hueRange: [175, 198] },
  { name: 'Cobalt Blue', hueRange: [210, 238] },
  { name: 'Royal Violet', hueRange: [265, 290] },
  { name: 'Neon Magenta', hueRange: [305, 335] },
];

/**
 * Returns round time limit in milliseconds scaled progressively over 10 rounds
 * START = already fast and challenging (~2.2s)
 */
export function getProgressiveTimeLimit(round: number): number {
  switch (round) {
    case 1:
      return 2200;
    case 2:
      return 2000;
    case 3:
      return 1800;
    case 4:
      return 1600;
    case 5:
      return 1500;
    case 6:
      return 1400;
    case 7:
      return 1300;
    case 8:
      return 1200;
    case 9:
      return 1100;
    case 10:
    default:
      return 1000;
  }
}

/**
 * Generates progressive color challenge with 4 to 6 large touch targets
 */
export function generateProgressiveChallenge(round: number): {
  target: ColorItem;
  options: ColorItem[];
  timeLimitMs: number;
} {
  // 1. Pick random base anchor
  const palette = PALETTES[Math.floor(Math.random() * PALETTES.length)];
  const [minH, maxH] = palette.hueRange;
  const baseHue = minH > maxH 
    ? (Math.random() > 0.5 ? Math.floor(Math.random() * (360 - minH) + minH) : Math.floor(Math.random() * maxH))
    : Math.floor(Math.random() * (maxH - minH) + minH);

  const baseSat = Math.floor(Math.random() * 15 + 82); // 82% - 97% vivid saturation
  const baseLight = Math.floor(Math.random() * 14 + 44); // 44% - 58% lightness

  const targetHex = hslToHex(baseHue, baseSat, baseLight);
  const target: ColorItem = {
    id: `target_${Date.now()}_${Math.random()}`,
    hex: targetHex,
    name: palette.name,
    hsl: [baseHue, baseSat, baseLight],
    isCorrect: true,
  };

  // 2. Determine option count and Delta-E separation based on round (1 to 10)
  let optionCount = 4;
  let hueDeltaRange: [number, number] = [26, 38];
  let lightDeltaRange: [number, number] = [14, 20];

  if (round <= 2) {
    // Rounds 1-2: 4 choices, demanding chromatic distinction
    optionCount = 4;
    hueDeltaRange = [24, 34];
    lightDeltaRange = [12, 18];
  } else if (round <= 3) {
    // Round 3: 4 choices, close hues
    optionCount = 4;
    hueDeltaRange = [18, 26];
    lightDeltaRange = [10, 15];
  } else if (round <= 5) {
    // Rounds 4-5: 6 choices, close shades
    optionCount = 6;
    hueDeltaRange = [13, 20];
    lightDeltaRange = [7, 12];
  } else if (round <= 7) {
    // Rounds 6-7: 6 choices, subtle variance
    optionCount = 6;
    hueDeltaRange = [9, 14];
    lightDeltaRange = [5, 9];
  } else {
    // Rounds 8-10: 6 choices, refined micro-chromatic challenge
    optionCount = 6;
    hueDeltaRange = [5, 9];
    lightDeltaRange = [3, 6];
  }

  // 3. Generate distractors
  const distractors: ColorItem[] = [];
  const usedOffsets = new Set<string>();

  for (let i = 0; i < optionCount - 1; i++) {
    let distractorHue = baseHue;
    let distractorSat = baseSat;
    let distractorLight = baseLight;

    const signH = (i % 2 === 0 ? 1 : -1) * (Math.random() > 0.4 ? 1 : -1);
    const signL = (i % 2 === 1 ? 1 : -1);

    const hOffset = Math.floor(Math.random() * (hueDeltaRange[1] - hueDeltaRange[0]) + hueDeltaRange[0]) * signH;
    const lOffset = Math.floor(Math.random() * (lightDeltaRange[1] - lightDeltaRange[0]) + lightDeltaRange[0]) * signL;

    const offsetKey = `${Math.sign(hOffset)}_${Math.round(Math.abs(hOffset) / 6)}_${Math.sign(lOffset)}`;
    if (usedOffsets.has(offsetKey)) {
      distractorHue = (baseHue + hOffset * 1.3 + (i + 1) * 14) % 360;
    } else {
      usedOffsets.add(offsetKey);
      distractorHue = (baseHue + hOffset) % 360;
    }

    distractorLight = Math.max(26, Math.min(76, baseLight + lOffset));
    distractorSat = Math.max(65, Math.min(100, baseSat + (Math.random() * 10 - 5)));

    const distHex = hslToHex(distractorHue, distractorSat, distractorLight);

    distractors.push({
      id: `dist_${i}_${Date.now()}_${Math.random()}`,
      hex: distHex,
      hsl: [distractorHue, distractorSat, distractorLight],
      isCorrect: false,
    });
  }

  // 4. Combine and shuffle options
  const correctOption: ColorItem = {
    ...target,
    id: `correct_${Date.now()}_${Math.random()}`,
  };

  const allOptions = [correctOption, ...distractors];
  for (let i = allOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
  }

  return {
    target,
    options: allOptions,
    timeLimitMs: getProgressiveTimeLimit(round),
  };
}
