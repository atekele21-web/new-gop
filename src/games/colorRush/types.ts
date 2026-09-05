/**
 * Color Rush - Types & Interfaces
 */

export interface ColorItem {
  id: string;
  hex: string;
  name?: string;
  hsl: [number, number, number]; // [hue 0-360, sat 0-100, light 0-100]
  isCorrect: boolean;
}

export interface FloatingPoint {
  id: string;
  points: number;
  comboText?: string;
  isBonus?: boolean;
}

export interface ColorRushRoundResult {
  round: number;
  isCorrect: boolean;
  reactionTimeMs: number;
  pointsEarned: number;
  combo: number;
}
