/**
 * World Legends - Word-Connect Progressive Level Bank
 * 
 * Progressive Structure:
 * - Levels 1–5: Simple 3–4 letter words
 * - Levels 6–10: 4–5 letter words
 * - Levels 11–20: 5–6 letter words
 * - Levels 21–30+: Mixed 5–7+ letter anagram puzzles
 * 
 * Scoring Formula:
 * - Base word: 2 points per letter
 * - Length bonus: 3-letter: +5, 4-letter: +10, 5-letter: +15, 6-letter: +20, 7+-letter: +25
 * - Speed/combo bonus added during gameplay
 * - Strict session cap: MAX 400 POINTS TOTAL
 */

import { LevelData } from './types';

// Standard letter point values for display
export const LETTER_VALUES: Record<string, number> = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4,
  I: 1, J: 8, K: 5, L: 1, M: 3, N: 1, O: 1, P: 3,
  Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8,
  Y: 4, Z: 10
};

export const getLetterValue = (char: string): number => {
  return LETTER_VALUES[char.toUpperCase()] || 1;
};

export function calculateWordPoints(word: string): number {
  const len = word.length;
  let lenBonus = 0;
  if (len === 3) lenBonus = 5;
  else if (len === 4) lenBonus = 10;
  else if (len === 5) lenBonus = 15;
  else if (len === 6) lenBonus = 20;
  else if (len >= 7) lenBonus = 25;

  return len * 2 + lenBonus;
}

export const WORLD_LEGENDS_LEVELS: LevelData[] = [
  // =========================================================================
  // LEVELS 1–5: Challenging 4–5 letter anagram puzzles from the start
  // =========================================================================
  {
    levelNumber: 1,
    theme: 'Golden Sands',
    letters: ['S', 'P', 'A', 'R', 'K'],
    targetWords: [
      { word: 'SPARK', points: calculateWordPoints('SPARK') },
      { word: 'PARK', points: calculateWordPoints('PARK') },
      { word: 'SPAR', points: calculateWordPoints('SPAR') },
      { word: 'RAPS', points: calculateWordPoints('RAPS') },
    ],
    bonusWords: ['RASP', 'ARKS', 'RAP', 'ARK'],
  },
  {
    levelNumber: 2,
    theme: 'Forest Grove',
    letters: ['B', 'R', 'A', 'V', 'E'],
    targetWords: [
      { word: 'BRAVE', points: calculateWordPoints('BRAVE') },
      { word: 'BEAR', points: calculateWordPoints('BEAR') },
      { word: 'RAVE', points: calculateWordPoints('RAVE') },
      { word: 'BARE', points: calculateWordPoints('BARE') },
    ],
    bonusWords: ['VERB', 'EAR', 'BAR'],
  },
  {
    levelNumber: 3,
    theme: 'Amber Peak',
    letters: ['F', 'L', 'A', 'M', 'E'],
    targetWords: [
      { word: 'FLAME', points: calculateWordPoints('FLAME') },
      { word: 'MEAL', points: calculateWordPoints('MEAL') },
      { word: 'LEAF', points: calculateWordPoints('LEAF') },
      { word: 'FAME', points: calculateWordPoints('FAME') },
    ],
    bonusWords: ['MALE', 'LAME', 'FLEA'],
  },
  {
    levelNumber: 4,
    theme: 'Night Sky',
    letters: ['S', 'T', 'O', 'R', 'M'],
    targetWords: [
      { word: 'STORM', points: calculateWordPoints('STORM') },
      { word: 'MOST', points: calculateWordPoints('MOST') },
      { word: 'SORT', points: calculateWordPoints('SORT') },
      { word: 'ROTS', points: calculateWordPoints('ROTS') },
    ],
    bonusWords: ['TOMS', 'MORT', 'ROT', 'SET'],
  },
  {
    levelNumber: 5,
    theme: 'Emerald Valley',
    letters: ['P', 'L', 'A', 'N', 'E', 'T'],
    targetWords: [
      { word: 'PLANET', points: calculateWordPoints('PLANET') },
      { word: 'PLANT', points: calculateWordPoints('PLANT') },
      { word: 'PLANE', points: calculateWordPoints('PLANE') },
      { word: 'PANEL', points: calculateWordPoints('PANEL') },
    ],
    bonusWords: ['LATE', 'LEAN', 'NEAT', 'PALE', 'PLAN'],
  },

  // =========================================================================
  // LEVELS 6–10: 4–5 letter words
  // =========================================================================
  {
    levelNumber: 6,
    theme: 'River Whisper',
    letters: ['B', 'I', 'R', 'D', 'P'],
    targetWords: [
      { word: 'BIRD', points: calculateWordPoints('BIRD') },
      { word: 'DRIP', points: calculateWordPoints('DRIP') },
      { word: 'RIB', points: calculateWordPoints('RIB') },
      { word: 'DIP', points: calculateWordPoints('DIP') },
    ],
    bonusWords: ['RIP', 'BID'],
  },
  {
    levelNumber: 7,
    theme: 'Twilight Glade',
    letters: ['G', 'L', 'O', 'W', 'R'],
    targetWords: [
      { word: 'GLOW', points: calculateWordPoints('GLOW') },
      { word: 'GROW', points: calculateWordPoints('GROW') },
      { word: 'ROW', points: calculateWordPoints('ROW') },
      { word: 'LOW', points: calculateWordPoints('LOW') },
    ],
    bonusWords: ['OWL', 'LOG'],
  },
  {
    levelNumber: 8,
    theme: 'Highland Trail',
    letters: ['T', 'R', 'A', 'I', 'N'],
    targetWords: [
      { word: 'TRAIN', points: calculateWordPoints('TRAIN') },
      { word: 'RAIN', points: calculateWordPoints('RAIN') },
      { word: 'RANT', points: calculateWordPoints('RANT') },
      { word: 'AIR', points: calculateWordPoints('AIR') },
    ],
    bonusWords: ['TIN', 'TAN', 'ART', 'TAR', 'RAT', 'RAN'],
  },
  {
    levelNumber: 9,
    theme: 'Crystal Frost',
    letters: ['F', 'R', 'O', 'S', 'T'],
    targetWords: [
      { word: 'FROST', points: calculateWordPoints('FROST') },
      { word: 'FORTS', points: calculateWordPoints('FORTS') },
      { word: 'FORT', points: calculateWordPoints('FORT') },
      { word: 'SOFT', points: calculateWordPoints('SOFT') },
    ],
    bonusWords: ['SORT', 'FOR', 'ROT'],
  },
  {
    levelNumber: 10,
    theme: 'Mystic Flame',
    letters: ['F', 'L', 'A', 'M', 'E'],
    targetWords: [
      { word: 'FLAME', points: calculateWordPoints('FLAME') },
      { word: 'MALE', points: calculateWordPoints('MALE') },
      { word: 'FAME', points: calculateWordPoints('FAME') },
      { word: 'LEAF', points: calculateWordPoints('LEAF') },
    ],
    bonusWords: ['LAME', 'ALE', 'ELF'],
  },

  // =========================================================================
  // LEVELS 11–20: 5–6 letter words
  // =========================================================================
  {
    levelNumber: 11,
    theme: 'Desert Oasis',
    letters: ['P', 'L', 'A', 'N', 'E', 'T'],
    targetWords: [
      { word: 'PLANET', points: calculateWordPoints('PLANET') },
      { word: 'PLANT', points: calculateWordPoints('PLANT') },
      { word: 'PLANE', points: calculateWordPoints('PLANE') },
      { word: 'LATE', points: calculateWordPoints('LATE') },
      { word: 'TALE', points: calculateWordPoints('TALE') },
    ],
    bonusWords: ['LANE', 'PALE', 'LEAP', 'NEAT', 'PLEA', 'PAN', 'PEN', 'TAP', 'PET', 'LET', 'NET'],
  },
  {
    levelNumber: 12,
    theme: 'Ancient Castle',
    letters: ['C', 'A', 'S', 'T', 'L', 'E'],
    targetWords: [
      { word: 'CASTLE', points: calculateWordPoints('CASTLE') },
      { word: 'SCALE', points: calculateWordPoints('SCALE') },
      { word: 'LACE', points: calculateWordPoints('LACE') },
      { word: 'EAST', points: calculateWordPoints('EAST') },
      { word: 'CATS', points: calculateWordPoints('CATS') },
    ],
    bonusWords: ['TALE', 'LATE', 'SEAL', 'SALE', 'CASE', 'CAST', 'ACTS', 'SET', 'CAT', 'TEA'],
  },
  {
    levelNumber: 13,
    theme: 'Knight Citadel',
    letters: ['S', 'H', 'I', 'E', 'L', 'D'],
    targetWords: [
      { word: 'SHIELD', points: calculateWordPoints('SHIELD') },
      { word: 'SLIDE', points: calculateWordPoints('SLIDE') },
      { word: 'HIDE', points: calculateWordPoints('HIDE') },
      { word: 'DISH', points: calculateWordPoints('DISH') },
      { word: 'HELD', points: calculateWordPoints('HELD') },
    ],
    bonusWords: ['SHED', 'SIDE', 'IDLE', 'LIED', 'LIES', 'LED', 'HIS', 'HIM'],
  },
  {
    levelNumber: 14,
    theme: 'Silver Falcon',
    letters: ['F', 'A', 'L', 'C', 'O', 'N'],
    targetWords: [
      { word: 'FALCON', points: calculateWordPoints('FALCON') },
      { word: 'CLAN', points: calculateWordPoints('CLAN') },
      { word: 'COAL', points: calculateWordPoints('COAL') },
      { word: 'LOAF', points: calculateWordPoints('LOAF') },
    ],
    bonusWords: ['CALF', 'COLA', 'FOAL', 'FAN', 'CAN'],
  },
  {
    levelNumber: 15,
    theme: 'Sunken Temple',
    letters: ['T', 'E', 'M', 'P', 'L', 'E'],
    targetWords: [
      { word: 'TEMPLE', points: calculateWordPoints('TEMPLE') },
      { word: 'MEET', points: calculateWordPoints('MEET') },
      { word: 'MELT', points: calculateWordPoints('MELT') },
      { word: 'PEEL', points: calculateWordPoints('PEEL') },
    ],
    bonusWords: ['PELT', 'PLOT', 'PET', 'LET', 'MET'],
  },
  {
    levelNumber: 16,
    theme: 'Astral Meteor',
    letters: ['M', 'E', 'T', 'E', 'O', 'R'],
    targetWords: [
      { word: 'METEOR', points: calculateWordPoints('METEOR') },
      { word: 'REMOTE', points: calculateWordPoints('REMOTE') },
      { word: 'MORE', points: calculateWordPoints('MORE') },
      { word: 'TREE', points: calculateWordPoints('TREE') },
      { word: 'MEET', points: calculateWordPoints('MEET') },
    ],
    bonusWords: ['TERM', 'TORE', 'ROTE', 'ROAM', 'ROE', 'MET'],
  },
  {
    levelNumber: 17,
    theme: 'Hidden Treasure',
    letters: ['P', 'I', 'R', 'A', 'T', 'E'],
    targetWords: [
      { word: 'PIRATE', points: calculateWordPoints('PIRATE') },
      { word: 'TRIP', points: calculateWordPoints('TRIP') },
      { word: 'PART', points: calculateWordPoints('PART') },
      { word: 'RIPE', points: calculateWordPoints('RIPE') },
      { word: 'RATE', points: calculateWordPoints('RATE') },
    ],
    bonusWords: ['TAPE', 'PAIR', 'PEAR', 'TRAP', 'PIER', 'RITE', 'TEAR', 'AIR', 'PIT', 'TIP', 'EAT', 'TEA', 'PET'],
  },
  {
    levelNumber: 18,
    theme: 'Dragon Lair',
    letters: ['D', 'R', 'A', 'G', 'O', 'N'],
    targetWords: [
      { word: 'DRAGON', points: calculateWordPoints('DRAGON') },
      { word: 'ORGAN', points: calculateWordPoints('ORGAN') },
      { word: 'ROAD', points: calculateWordPoints('ROAD') },
      { word: 'ROAN', points: calculateWordPoints('ROAN') },
      { word: 'RANG', points: calculateWordPoints('RANG') },
    ],
    bonusWords: ['GRAND', 'GROAN', 'DOG', 'RAG', 'GOD', 'OAR', 'AND', 'NOR'],
  },
  {
    levelNumber: 19,
    theme: 'Shadow Canyon',
    letters: ['S', 'H', 'A', 'D', 'O', 'W'],
    targetWords: [
      { word: 'SHADOW', points: calculateWordPoints('SHADOW') },
      { word: 'SHOW', points: calculateWordPoints('SHOW') },
      { word: 'WASH', points: calculateWordPoints('WASH') },
      { word: 'DASH', points: calculateWordPoints('DASH') },
      { word: 'SODA', points: calculateWordPoints('SODA') },
    ],
    bonusWords: ['HOOD', 'SHOD', 'WHO', 'HOW', 'SOW', 'HAD', 'ASH'],
  },
  {
    levelNumber: 20,
    theme: 'Cosmic Zenith',
    letters: ['Z', 'E', 'N', 'I', 'T', 'H'],
    targetWords: [
      { word: 'ZENITH', points: calculateWordPoints('ZENITH') },
      { word: 'THEN', points: calculateWordPoints('THEN') },
      { word: 'HINT', points: calculateWordPoints('HINT') },
      { word: 'THIN', points: calculateWordPoints('THIN') },
      { word: 'NET', points: calculateWordPoints('NET') },
    ],
    bonusWords: ['TIE', 'HIT', 'TIN', 'TEN', 'HEN'],
  },

  // =========================================================================
  // LEVELS 21–30+: Mixed 5–7+ letter anagram puzzles
  // =========================================================================
  {
    levelNumber: 21,
    theme: 'Sphinx Riddle',
    letters: ['S', 'P', 'H', 'I', 'N', 'X'],
    targetWords: [
      { word: 'SPHINX', points: calculateWordPoints('SPHINX') },
      { word: 'SPIN', points: calculateWordPoints('SPIN') },
      { word: 'SHIP', points: calculateWordPoints('SHIP') },
      { word: 'PIN', points: calculateWordPoints('PIN') },
      { word: 'NIP', points: calculateWordPoints('NIP') },
    ],
    bonusWords: ['SIN', 'HIS', 'HIP', 'SIX'],
  },
  {
    levelNumber: 22,
    theme: 'Viking Voyage',
    letters: ['V', 'I', 'K', 'I', 'N', 'G'],
    targetWords: [
      { word: 'VIKING', points: calculateWordPoints('VIKING') },
      { word: 'KING', points: calculateWordPoints('KING') },
      { word: 'WING', points: calculateWordPoints('WING') },
      { word: 'INK', points: calculateWordPoints('INK') },
    ],
    bonusWords: ['GIN', 'KIN'],
  },
  {
    levelNumber: 23,
    theme: 'Wizard Sanctum',
    letters: ['W', 'I', 'Z', 'A', 'R', 'D'],
    targetWords: [
      { word: 'WIZARD', points: calculateWordPoints('WIZARD') },
      { word: 'DRAW', points: calculateWordPoints('DRAW') },
      { word: 'RAID', points: calculateWordPoints('RAID') },
      { word: 'BIRD', points: calculateWordPoints('BIRD') },
      { word: 'RAW', points: calculateWordPoints('RAW') },
    ],
    bonusWords: ['WAR', 'AIR', 'RID'],
  },
  {
    levelNumber: 24,
    theme: 'Quartz Matrix',
    letters: ['M', 'A', 'T', 'R', 'I', 'X'],
    targetWords: [
      { word: 'MATRIX', points: calculateWordPoints('MATRIX') },
      { word: 'TRAM', points: calculateWordPoints('TRAM') },
      { word: 'MAXI', points: calculateWordPoints('MAXI') },
      { word: 'TRIM', points: calculateWordPoints('TRIM') },
      { word: 'RAM', points: calculateWordPoints('RAM') },
    ],
    bonusWords: ['MIX', 'AIR', 'ART', 'RAT', 'TAR', 'AIM', 'ARM', 'MAT', 'MAX'],
  },
  {
    levelNumber: 25,
    theme: 'Crystal Legend',
    letters: ['L', 'E', 'G', 'E', 'N', 'D'],
    targetWords: [
      { word: 'LEGEND', points: calculateWordPoints('LEGEND') },
      { word: 'NEED', points: calculateWordPoints('NEED') },
      { word: 'GLEN', points: calculateWordPoints('GLEN') },
      { word: 'LEND', points: calculateWordPoints('LEND') },
      { word: 'EDGE', points: calculateWordPoints('EDGE') },
    ],
    bonusWords: ['EEL', 'DEN', 'LED', 'END', 'GEL'],
  },
];

export function getLevelData(levelIndex: number): LevelData {
  const idx = levelIndex % WORLD_LEGENDS_LEVELS.length;
  const baseLevel = WORLD_LEGENDS_LEVELS[idx];
  return {
    ...baseLevel,
    levelNumber: levelIndex + 1,
  };
}
