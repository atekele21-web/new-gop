/**
 * Pop Piano - Types & Interfaces for Piano Tiles Mobile Game
 */

export type GameStatus = 'start' | 'ready' | 'playing' | 'paused' | 'game_over';

export type JudgementType = 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS';

export interface PianoTileModel {
  id: string;
  noteIndex: number;
  lane: 0 | 1 | 2 | 3;
  y: number; // Current Y position in canvas coordinates
  height: number;
  width: number;
  pitch: string;
  frequency: number;
  isHit: boolean;
  isMissed: boolean;
  hitAnimTime: number; // ms elapsed since hit (0-120ms)
  judgement?: JudgementType;
}

export interface HitEffectParticle {
  id: string;
  lane: 0 | 1 | 2 | 3;
  x: number;
  y: number;
  text: string;
  type: JudgementType;
  points: number;
  alpha: number;
  scale: number;
  createdAt: number;
}

export interface PopPianoStorage {
  bestScore: number;
  bestCombo: number;
  totalNotesHit: number;
  totalGames: number;
}
