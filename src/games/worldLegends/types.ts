/**
 * World Legends - Word-Connect Tournament Types
 */

export interface TargetWord {
  word: string;
  points: number;
  hint?: string;
  isBonus?: boolean;
}

export interface LevelData {
  levelNumber: number;
  theme: string;
  letters: string[]; // e.g. ['S', 'T', 'A', 'R']
  targetWords: TargetWord[];
  bonusWords?: string[]; // Extra dictionary words that can be swiped for bonus points
}

export interface WordRecord {
  level: number;
  word: string;
  isSolved: boolean;
  points: number;
}

export interface SessionResultData {
  score: number; // Max 400
  timeUsedSec: number;
  levelReached: number;
  wordsSolved: number;
  wordsTotal: number;
  records: WordRecord[];
}

export interface LetterPoint {
  id: number;
  letter: string;
  x: number; // Percentage or px offset on wheel
  y: number;
}
