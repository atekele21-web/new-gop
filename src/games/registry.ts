/**
 * Game Registry for TelePlus Ethiopia
 * Houses the catalog of independent modular games with metadata, tags, and category routing.
 */

import { GameDefinition, GameCategory } from '../types';
import { SIX_MODULAR_GAMES } from '../services/demoData';

export interface CategoryInfo {
  id: GameCategory;
  name: string;
  nameAmharic: string;
  description: string;
}

export const GAME_CATEGORIES: CategoryInfo[] = [
  { id: 'all', name: 'All Games', nameAmharic: 'ሁሉም ጨዋታዎች', description: 'Complete catalog of TelePlus games' },
  { id: 'action', name: 'Action', nameAmharic: 'አክሽን', description: 'Fast reactions, movement, and highland physics' },
  { id: 'arcade', name: 'Arcade', nameAmharic: 'አርኬድ', description: 'Fast casual skill and reflex tapping' },
  { id: 'puzzle', name: 'Puzzle', nameAmharic: 'እንቆቅልሽ', description: 'Logic, matching, memory, and legendary trivia' },
  { id: 'sports', name: 'Sports', nameAmharic: 'ስፖርት', description: 'Precision recurve bow target archery' },
  { id: 'music', name: 'Music', nameAmharic: 'ሙዚቃ', description: 'Rhythm, piano keys, and acoustic melodies' },
  { id: 'board', name: 'Board', nameAmharic: 'ቦርድ', description: 'Traditional board and turn-based games' },
  { id: 'other', name: 'Other', nameAmharic: 'ሌሎች', description: 'Special and novelty casual games' },
];

export const GameRegistry = {
  getAllGames(): GameDefinition[] {
    return SIX_MODULAR_GAMES;
  },

  getGameById(id: string): GameDefinition | undefined {
    return SIX_MODULAR_GAMES.find((g) => g.id === id);
  },

  getFeaturedGames(): GameDefinition[] {
    return SIX_MODULAR_GAMES.filter((g) => g.featured);
  },

  getWeeklyFeaturedGames(): GameDefinition[] {
    return SIX_MODULAR_GAMES.filter((g) => g.featuredWeekly);
  },

  getGamesByCategory(category: GameCategory): GameDefinition[] {
    if (category === 'all') return SIX_MODULAR_GAMES;
    return SIX_MODULAR_GAMES.filter((g) => g.category === category);
  },

  getCategories(): CategoryInfo[] {
    return GAME_CATEGORIES;
  },

  searchGames(query: string): GameDefinition[] {
    if (!query.trim()) return SIX_MODULAR_GAMES;
    const lower = query.toLowerCase();
    return SIX_MODULAR_GAMES.filter(
      (g) =>
        g.title.toLowerCase().includes(lower) ||
        g.titleAmharic.includes(query) ||
        g.tagline.toLowerCase().includes(lower) ||
        g.category.toLowerCase().includes(lower)
    );
  },
};

