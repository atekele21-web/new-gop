/**
 * Games Catalog Page for TelePlus (EthioTelecom)
 * 
 * Strict Specification:
 * - WHITE background
 * - Top 3 Info Cards (Best Score, Total Games, Available Coins)
 * - Category filter tabs (All, Action, Arcade, Puzzle, Sports, Music)
 * - Clean game cards with original artwork and direct PLAY buttons
 * - Direct playability with no tournament entry locks
 */

import React, { useState, useMemo } from 'react';
import { GameDefinition, UserProfile, GameCategory } from '../types';
import { OriginalGameArtwork } from '../components/OriginalGameArtwork';
import { GameDetailPage } from './GameDetailPage';
import { 
  Coins, 
  Play, 
  Trophy, 
  Gamepad2,
  Sparkles
} from 'lucide-react';

interface GamesPageProps {
  games: GameDefinition[];
  profile: UserProfile;
  onLaunchGame: (game: GameDefinition) => void;
  categoryLabels?: Record<string, string>;
  onNavigateToLeaderboard?: () => void;
}

const CATEGORY_TABS: { id: GameCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Games' },
  { id: 'action', label: 'Action' },
  { id: 'arcade', label: 'Arcade' },
  { id: 'puzzle', label: 'Puzzle' },
  { id: 'sports', label: 'Sports' },
  { id: 'music', label: 'Music' },
];

export const GamesPage: React.FC<GamesPageProps> = ({
  games,
  profile,
  onLaunchGame,
  onNavigateToLeaderboard,
}) => {
  const [activeCategory, setActiveCategory] = useState<GameCategory | 'all'>('all');
  const [activeDetailGame, setActiveDetailGame] = useState<GameDefinition | null>(null);

  // Highest score achieved across all games
  const bestScore = useMemo(() => {
    const scores = Object.values(profile.highScores || {}) as number[];
    return scores.length > 0 ? Math.max(...scores) : 0;
  }, [profile.highScores]);

  const coinBalance = profile.coins ?? 25;

  // Filter games by category
  const displayedGames = useMemo(() => {
    if (activeCategory === 'all') return games;
    return games.filter((g) => g.category === activeCategory);
  }, [games, activeCategory]);

  if (activeDetailGame) {
    return (
      <GameDetailPage
        game={activeDetailGame}
        profile={profile}
        onBack={() => setActiveDetailGame(null)}
        onPlay={(g) => onLaunchGame(g)}
        onViewLeaderboard={() => {
          if (onNavigateToLeaderboard) {
            onNavigateToLeaderboard();
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#17202A] pb-24 select-none">
      <div className="max-w-md md:max-w-xl lg:max-w-3xl mx-auto px-3.5 pt-4 sm:pt-4.5 space-y-4">
        
        {/* =========================================================================
            1. SCORE + STATS SUMMARY (THREE NON-CLICKABLE INFORMATION CARDS)
           ========================================================================= */}
        <section 
          id="games-score-summary" 
          className="grid grid-cols-3 gap-2"
          aria-label="Player Score and Coin Summary"
        >
          {/* Best Score */}
          <div 
            id="games-summary-best"
            className="flex items-center gap-2 p-2.5 rounded-2xl bg-white border border-slate-200 shadow-xs select-none"
          >
            <div className="w-8 h-8 rounded-xl bg-[#1688C9] text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0 border border-white/20">
              <Trophy className="w-4 h-4 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider leading-none">
                Best Score
              </div>
              <div className="text-xs sm:text-sm font-black text-[#17202A] font-mono leading-tight truncate mt-0.5">
                {bestScore.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Catalog Count */}
          <div 
            id="games-summary-count"
            className="flex items-center gap-2 p-2.5 rounded-2xl bg-white border border-slate-200 shadow-xs select-none"
          >
            <div className="w-8 h-8 rounded-xl bg-[#1688C9] text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0 border border-white/20">
              <Gamepad2 className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider leading-none">
                Catalog
              </div>
              <div className="text-xs sm:text-sm font-black text-[#17202A] font-mono leading-tight truncate mt-0.5">
                {games.length} Games
              </div>
            </div>
          </div>

          {/* Available Coins */}
          <div 
            id="games-summary-coins"
            className="flex items-center gap-2 p-2.5 rounded-2xl bg-white border border-[#8BCB3D]/50 shadow-xs select-none"
          >
            <div className="w-8 h-8 rounded-xl bg-[#8BCB3D] text-white flex items-center justify-center shadow-xs shrink-0 border border-white/30">
              <Coins className="w-4 h-4 text-white fill-current" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider leading-none">
                Coins
              </div>
              <div className="text-xs sm:text-sm font-black text-[#17202A] font-mono leading-tight truncate mt-0.5">
                {coinBalance.toLocaleString()}
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            2. CATEGORY TABS FILTER
           ========================================================================= */}
        <section id="category-tab-selector" className="space-y-2">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none py-1">
            {CATEGORY_TABS.map((tab) => {
              const count = tab.id === 'all' 
                ? games.length 
                : games.filter((g) => g.category === tab.id).length;
              if (count === 0 && tab.id !== 'all') return null;

              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`games-cat-tab-${tab.id}`}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-[#8BCB3D] text-white shadow-xs'
                      : 'bg-slate-100 text-[#17202A] hover:bg-slate-200'
                  }`}
                >
                  {tab.label} ({count})
                </button>
              );
            })}
          </div>
        </section>

        {/* =========================================================================
            3. CLEAN GAME CARDS CATALOG
           ========================================================================= */}
        <section id="games-catalog-list" className="space-y-3">
          {displayedGames.map((game) => {
            const currentScore = profile.highScores?.[game.id] || 0;

            return (
              <div
                key={game.id}
                id={`game-card-${game.id}`}
                className="rounded-2xl bg-white border border-slate-200 hover:border-[#1688C9] shadow-xs p-3.5 flex items-center justify-between gap-3 transition-all"
              >
                {/* Left: Artwork + Details */}
                <div 
                  className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                  onClick={() => setActiveDetailGame(game)}
                >
                  <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200 shadow-xs">
                    <OriginalGameArtwork gameId={game.id} className="w-full h-full" />
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-[#1688C9] text-white text-[9px] font-black uppercase tracking-wider">
                        {game.category}
                      </span>
                      {game.featuredWeekly && (
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[9px] font-black uppercase tracking-wider border border-amber-200 flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                          <span>Featured</span>
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm sm:text-base font-black text-[#17202A] leading-tight truncate">
                      {game.title}
                    </h4>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-[#6B7280] font-bold">
                        {game.genre}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-blue-50 text-[#1688C9] text-[9.5px] font-mono font-black border border-blue-100">
                        Best: {currentScore}/400 PTS
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: PLAY CTA */}
                <button
                  id={`play-game-btn-${game.id}`}
                  onClick={() => onLaunchGame(game)}
                  className="px-4 py-2.5 rounded-xl bg-[#8BCB3D] hover:bg-[#7cb736] active:scale-95 text-white font-black text-xs uppercase tracking-wider shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>PLAY</span>
                </button>
              </div>
            );
          })}
        </section>

      </div>
    </div>
  );
};
