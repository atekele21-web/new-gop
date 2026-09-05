/**
 * Clean Visual Game Card Component for TelePlay Ethiopia
 * White card surface (#FFFFFF), Deep Blue: #0057A8, Green: #78BE20
 * Artwork, Title, Coin cost per play, and Play CTA.
 */

import React from 'react';
import { GameDefinition } from '../types';
import { 
  Play, 
  Star, 
  Coins, 
  Flame, 
  Sparkles, 
  Trophy, 
  Award
} from 'lucide-react';
import { OriginalGameArtwork } from './OriginalGameArtwork';

interface GameCardProps {
  game: GameDefinition;
  onPlay: (game: GameDefinition) => void;
  onClickCard?: (game: GameDefinition) => void;
  userHighScore?: number;
  featured?: boolean;
  tournamentBadge?: string;
  rewardBadge?: string;
}

export const GameCard: React.FC<GameCardProps> = ({ 
  game, 
  onPlay, 
  onClickCard,
  userHighScore, 
  featured,
  tournamentBadge,
  rewardBadge
}) => {
  const handleClick = () => {
    if (onClickCard) {
      onClickCard(game);
    } else {
      onPlay(game);
    }
  };

  const coinCost = game.energyCost ? game.energyCost * 10 : 10;

  return (
    <div
      id={`game-card-${game.id}`}
      onClick={handleClick}
      className="group relative rounded-2xl bg-white border border-slate-200 hover:border-[#0057A8] transition-all duration-200 overflow-hidden cursor-pointer shadow-sm hover:shadow-md flex flex-col"
    >
      {/* Top Original Artwork Container */}
      <div className="relative w-full overflow-hidden h-36 sm:h-40 bg-slate-100">
        {/* Vector & Thematic Artwork */}
        <OriginalGameArtwork gameId={game.id} className="w-full h-full" />
        
        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-20">
          <div className="flex flex-wrap items-center gap-1">
            {tournamentBadge && (
              <span className="px-2 py-0.5 rounded-md bg-[#0057A8] text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                <Trophy className="w-3 h-3 text-[#78BE20]" /> {tournamentBadge}
              </span>
            )}
            {rewardBadge && !tournamentBadge && (
              <span className="px-2 py-0.5 rounded-md bg-[#78BE20] text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                <Award className="w-3 h-3" /> {rewardBadge}
              </span>
            )}
            {game.isTrending && !tournamentBadge && !rewardBadge && (
              <span className="px-2 py-0.5 rounded-md bg-[#0057A8] text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                <Flame className="w-3 h-3 text-amber-400" /> Hot
              </span>
            )}
            {game.isNew && !tournamentBadge && !rewardBadge && (
              <span className="px-2 py-0.5 rounded-md bg-[#78BE20] text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3 h-3" /> New
              </span>
            )}
          </div>

          {/* Coin Cost Pill */}
          <span className="px-2 py-0.5 rounded-md bg-white/95 text-slate-900 border border-slate-200 text-[11px] font-mono font-bold flex items-center gap-1 shadow-sm">
            <Coins className="w-3 h-3 text-[#78BE20]" />
            <span>{coinCost} Coins</span>
          </span>
        </div>

        {/* Hover Quick Play Overlay */}
        <div className="absolute inset-0 bg-[#0057A8]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-20">
          <div className="w-11 h-11 rounded-full bg-[#78BE20] text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 ml-0.5 fill-current" />
          </div>
        </div>
      </div>

      {/* Card Info Section - Compact & Highly Visual */}
      <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between bg-white">
        <div className="flex items-start justify-between gap-1.5 mb-2">
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-[#0057A8] transition-colors leading-tight truncate">
              {game.title}
            </h3>
            {game.titleAmharic && (
              <div className="text-[11px] text-[#0057A8] font-bold truncate">
                {game.titleAmharic}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
            <Star className="w-3 h-3 fill-current text-amber-500" />
            <span>{game.rating}</span>
          </div>
        </div>

        {/* Bottom Actions & High Score / Play Button */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          {userHighScore && userHighScore > 0 ? (
            <div className="text-[11px] text-[#0057A8] font-mono font-bold truncate">
              Score: {userHighScore.toLocaleString()}
            </div>
          ) : (
            <span className="text-[10px] text-slate-500 font-medium truncate">
              {game.playsCount.toLocaleString()} plays
            </span>
          )}

          <button
            id={`play-button-${game.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onPlay(game);
            }}
            className="py-1.5 px-3.5 rounded-lg bg-[#78BE20] hover:bg-[#68a81b] text-white text-xs font-black active:scale-95 transition-all shadow-sm flex items-center gap-1 uppercase tracking-wider shrink-0"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>PLAY</span>
          </button>
        </div>
      </div>
    </div>
  );
};


