/**
 * TelePlus Ethiopia - Official Customer Home Portal
 * 
 * Clean, Game-Centric Home Portal:
 * - WHITE background
 * - Top 3 Info Cards:
 *   1. Best Score (trophy graphic)
 *   2. Games Catalog (gamepad graphic)
 *   3. Available Coins (clean coin graphic)
 *   (Not clickable, purely informational)
 * - Promotional Portal Banner (EthioTelecom Gaming - Play & High Scores)
 * - FEATURED GAMES (large horizontal cards, swipable, with direct PLAY NOW)
 * - ALL GAMES (browsable with direct play)
 * - Direct playability with NO tournament locks or entry logic
 */

import React, { useMemo } from 'react';
import { GameDefinition, UserProfile } from '../types';
import { OriginalGameArtwork } from '../components/OriginalGameArtwork';
import { 
  Coins, 
  Trophy, 
  Gamepad2, 
  Play, 
  ChevronRight, 
  Sparkles,
  Flame
} from 'lucide-react';

interface HomePageProps {
  games?: GameDefinition[];
  profile: UserProfile;
  onLaunchGame: (game: GameDefinition) => void;
  onOpenBuyCoins?: () => void;
  onNavigateToGames: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  games = [],
  profile,
  onLaunchGame,
  onNavigateToGames,
}) => {
  // Best Score achieved across all games
  const bestScore = useMemo(() => {
    const scores = Object.values(profile.highScores || {}) as number[];
    return scores.length > 0 ? Math.max(...scores) : 0;
  }, [profile.highScores]);

  const coinBalance = profile.coins ?? 25;

  // Featured games (featuredWeekly flag or top trending)
  const featuredGames = useMemo(() => {
    const featured = games.filter((g) => g.featuredWeekly);
    return featured.length > 0 ? featured : games.slice(0, 3);
  }, [games]);

  return (
    <div className="min-h-screen bg-white text-[#17202A] pb-24 select-none">
      <div className="max-w-md md:max-w-xl lg:max-w-3xl mx-auto px-3.5 pt-4 sm:pt-4.5 space-y-4">
        
        {/* =========================================================================
            1. SCORE + STATS SUMMARY (THREE NON-CLICKABLE INFORMATION CARDS)
           ========================================================================= */}
        <section 
          id="score-coin-summary" 
          className="grid grid-cols-3 gap-2"
          aria-label="Player Score and Coin Summary"
        >
          {/* Best Score */}
          <div 
            id="summary-card-best-score"
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
            id="summary-card-games"
            className="flex items-center gap-2 p-2.5 rounded-2xl bg-white border border-slate-200 shadow-xs select-none"
          >
            <div className="w-8 h-8 rounded-xl bg-[#1688C9] text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0 border border-white/20">
              <Gamepad2 className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider leading-none">
                Games
              </div>
              <div className="text-xs sm:text-sm font-black text-[#17202A] font-mono leading-tight truncate mt-0.5">
                {games.length} Ready
              </div>
            </div>
          </div>

          {/* Available Coins */}
          <div 
            id="summary-card-coins"
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
            2. PROMOTIONAL BANNER
           ========================================================================= */}
        <section 
          id="home-promo-banner"
          className="relative w-full rounded-2xl overflow-hidden bg-[#1688C9] text-white shadow-sm"
        >
          <div className="relative aspect-[21/9] sm:aspect-[24/9] w-full overflow-hidden flex items-center justify-between p-4 bg-gradient-to-r from-[#1688C9] via-[#1277b0] to-[#0e6394]">
            {/* Background Graphic Pattern */}
            <div className="absolute inset-0 opacity-15 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 400 160" preserveAspectRatio="none">
                <circle cx="340" cy="80" r="100" fill="#8BCB3D" />
                <path d="M0 160 L180 0 L240 160 Z" fill="#ffffff" />
              </svg>
            </div>

            {/* Left Content */}
            <div className="relative z-10 max-w-[68%] space-y-1">
              <span className="inline-block px-2 py-0.5 rounded-md bg-[#8BCB3D] text-white text-[9px] font-black uppercase tracking-wider">
                ETHIOTELECOM GAMING
              </span>
              <h2 className="text-sm sm:text-lg font-black text-white leading-tight tracking-tight drop-shadow-sm">
                Play Top Games & Set High Scores
              </h2>
              <p className="text-[10px] sm:text-xs text-blue-50 font-medium line-clamp-1">
                Instant skill-based games with direct play and daily achievements.
              </p>
            </div>

            {/* Right Graphic Emblem */}
            <div className="relative z-10 flex flex-col items-center justify-center shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-md">
                <Gamepad2 className="w-8 h-8 text-[#8BCB3D] drop-shadow" />
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            3. FEATURED GAMES (LARGE HORIZONTAL SWIPABLE CARDS)
           ========================================================================= */}
        <section id="featured-games-section" className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <h3 className="text-xs sm:text-sm font-black text-[#17202A] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#8BCB3D]" />
              <span>FEATURED GAMES</span>
            </h3>
            <button
              id="featured-games-see-all"
              onClick={onNavigateToGames}
              className="text-xs font-black text-[#1688C9] hover:text-[#8BCB3D] flex items-center gap-0.5 uppercase tracking-wider transition-colors cursor-pointer"
            >
              <span>SEE ALL</span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>

          {/* Horizontally Swipable Single-Card Carousel */}
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-1">
            {featuredGames.map((game) => {
              const personalBest = profile.highScores?.[game.id] || 0;
              return (
                <div
                  key={game.id}
                  id={`featured-card-${game.id}`}
                  className="snap-center shrink-0 w-full rounded-2xl bg-white border border-slate-200 hover:border-[#1688C9] shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all"
                >
                  {/* Left: Prominent Artwork + Info */}
                  <div className="flex items-center gap-3.5 w-full sm:w-auto">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200 shadow-xs">
                      <OriginalGameArtwork gameId={game.id} className="w-full h-full" />
                    </div>

                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-[#1688C9] text-white text-[9px] font-black uppercase tracking-wider">
                          {game.category}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200 flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                          <span>Featured</span>
                        </span>
                      </div>

                      <h4 className="text-base font-black text-[#17202A] leading-tight truncate">
                        {game.title}
                      </h4>

                      <div className="text-xs font-black text-[#1688C9] flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5 text-[#8BCB3D] shrink-0" />
                        <span>Best: {personalBest} PTS</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: PLAY NOW CTA */}
                  <button
                    id={`play-featured-${game.id}`}
                    onClick={() => onLaunchGame(game)}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#8BCB3D] hover:bg-[#7cb736] active:scale-95 text-white font-black text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>PLAY NOW</span>
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* =========================================================================
            4. ALL GAMES QUICK CATALOG
           ========================================================================= */}
        <section id="popular-games-section" className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <h3 className="text-xs sm:text-sm font-black text-[#17202A] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#1688C9]" />
              <span>ALL GAMES</span>
            </h3>
            <button
              id="popular-games-see-all"
              onClick={onNavigateToGames}
              className="text-xs font-black text-[#1688C9] hover:text-[#8BCB3D] flex items-center gap-0.5 uppercase tracking-wider transition-colors cursor-pointer"
            >
              <span>BROWSE ALL</span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {games.map((game) => {
              const personalBest = profile.highScores?.[game.id] || 0;
              return (
                <div
                  key={game.id}
                  id={`home-game-row-${game.id}`}
                  className="rounded-2xl bg-white border border-slate-200 hover:border-[#1688C9] shadow-xs p-3 flex items-center justify-between gap-3 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200">
                      <OriginalGameArtwork gameId={game.id} className="w-full h-full" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-black text-[#17202A] truncate">
                        {game.title}
                      </div>
                      <div className="text-[10px] text-[#6B7280] font-bold">
                        {game.genre}
                      </div>
                      <div className="text-[10px] font-mono font-black text-[#1688C9]">
                        Best: {personalBest} PTS
                      </div>
                    </div>
                  </div>

                  <button
                    id={`play-home-game-${game.id}`}
                    onClick={() => onLaunchGame(game)}
                    className="px-3.5 py-2 rounded-xl bg-[#8BCB3D] hover:bg-[#7cb736] active:scale-95 text-white font-black text-xs uppercase tracking-wider shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play</span>
                  </button>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
};
