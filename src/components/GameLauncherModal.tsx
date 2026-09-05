/**
 * TelePlay Ethiopia - Game Launcher & Session Bridge Modal
 * Clean, professional EthioTelecom mobile gaming container.
 * No Energy. No VIP. No advertising. No sponsor rewards.
 */

import React, { useState } from 'react';
import { GameDefinition, UserProfile, GameSessionResult } from '../types';
import { CandyBlastGame } from '../games/candyBlast/CandyBlastGame';
import { ColorRushGame } from '../games/colorRush/ColorRushGame';
import { WorldLegendsGame } from '../games/worldLegends/WorldLegendsGame';
import { PopPianoGame } from '../games/popPiano/PopPianoGame';
import { HillRiderGame } from '../games/hillRider/HillRiderGame';
import { PopBalloonGame } from '../games/popBalloon/PopBalloonGame';
import { ArcheryStrikeGame } from '../games/archeryStrike/ArcheryStrikeGame';
import { InteractiveGameRunner } from '../games/interactiveSimulator';
import { 
  X, 
  RotateCcw, 
  Trophy, 
  Award, 
  Sparkles, 
  ArrowLeft, 
  Coins 
} from 'lucide-react';

interface GameLauncherModalProps {
  game: GameDefinition;
  profile: UserProfile;
  lastResult: GameSessionResult | null;
  onClose: () => void;
  onGameOver: (score: number, durationSeconds: number) => void;
  onPlayAgain: () => void;
  onWatchAdForDouble?: () => void;
  isAudioEnabled?: boolean;
}

export const GameLauncherModal: React.FC<GameLauncherModalProps> = ({
  game,
  profile,
  lastResult,
  onClose,
  onGameOver,
  onPlayAgain,
  isAudioEnabled = true,
}) => {
  // World Legends handles its own compact in-game HUD and standalone experience
  if (game.id === 'world-legends') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col justify-center items-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
        <WorldLegendsGame
          game={game}
          profile={profile}
          onGameOver={onGameOver}
          onExit={onClose}
          isAudioEnabled={isAudioEnabled}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col justify-between overflow-y-auto animate-in fade-in duration-200 font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Top Game Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#1688C9] text-white border-b border-blue-600">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit</span>
        </button>

        <div className="flex flex-col items-center">
          <span className="text-sm font-black text-white leading-tight">{game.title}</span>
          <span className="text-[10px] text-[#8BCB3D] font-bold tracking-wide">{game.titleAmharic}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-xl bg-white/15 text-white text-xs font-mono font-bold flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 fill-current text-amber-300" />
            <span>{profile.coins} Coins</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Game Stage / Session Container */}
      <div className="flex-1 max-w-xl w-full mx-auto p-3 sm:p-4 flex flex-col justify-center items-center">
        {/* For Candy Blast, Color Rush, World Legends, Pop Piano, and Hill Climb 3D, let their in-game state manager render their rich HUD and final screen */}
        {game.id === 'candy-blast' ? (
          <div className="w-full">
            <CandyBlastGame
              game={game}
              onGameOver={onGameOver}
              onExit={onClose}
              isAudioEnabled={isAudioEnabled}
            />
          </div>
        ) : game.id === 'color-rush' ? (
          <div className="w-full">
            <ColorRushGame
              game={game}
              onGameOver={onGameOver}
              onExit={onClose}
              isAudioEnabled={isAudioEnabled}
            />
          </div>
        ) : game.id === 'world-legends' ? (
          <div className="w-full">
            <WorldLegendsGame
              game={game}
              onGameOver={onGameOver}
              onExit={onClose}
              isAudioEnabled={isAudioEnabled}
            />
          </div>
        ) : game.id === 'pop-piano' ? (
          <div className="w-full">
            <PopPianoGame
              game={game}
              onGameOver={onGameOver}
              onExit={onClose}
              isAudioEnabled={isAudioEnabled}
            />
          </div>
        ) : game.id === 'hill-rider' ? (
          <div className="w-full">
            <HillRiderGame
              game={game}
              onGameOver={onGameOver}
              onExit={onClose}
              isAudioEnabled={isAudioEnabled}
            />
          </div>
        ) : game.id === 'archery-strike' ? (
          <div className="w-full">
            <ArcheryStrikeGame
              game={game}
              onGameOver={onGameOver}
              onExit={onClose}
              isAudioEnabled={isAudioEnabled}
            />
          </div>
        ) : game.id === 'pop-balloon' ? (
          <div className="w-full">
            <PopBalloonGame
              game={game}
              onGameOver={onGameOver}
              onExit={onClose}
              isAudioEnabled={isAudioEnabled}
            />
          </div>
        ) : !lastResult ? (
          /* ACTIVE PLAYING VIEW FOR OTHER GAMES */
          <div className="w-full">
            <InteractiveGameRunner
              game={game}
              onGameOver={onGameOver}
              isAudioEnabled={isAudioEnabled}
            />
          </div>
        ) : (
          /* CLEAN RESULT SCREEN (No Ads, No VIP, No Energy) */
          <div className="w-full max-w-md bg-[#05234A] text-white rounded-3xl p-6 border-2 border-[#0B3B70] shadow-2xl text-center animate-in zoom-in-95">
            {/* Header Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#78BE20]/20 border border-[#78BE20]/50 text-[#78BE20] text-xs font-black uppercase tracking-wider mb-3">
              <Award className="w-4 h-4" />
              <span>Match Completed</span>
            </div>

            {lastResult.isNewHighScore && (
              <div className="mb-3 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 font-black text-xs flex items-center justify-center gap-1.5 animate-pulse">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>NEW PERSONAL BEST!</span>
              </div>
            )}

            {/* Final Score Counter */}
            <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight mb-1">
              {lastResult.score.toLocaleString()}
            </div>
            <div className="text-xs text-slate-300 uppercase tracking-widest font-semibold mb-6">
              FINAL SCORE
            </div>

            {/* Results Matrix */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 text-left">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">GAME POINTS</div>
                <div className="text-base font-bold text-[#78BE20] font-mono">
                  +{lastResult.score} PTS
                </div>
              </div>

              <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 text-left">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">MATCH REWARDS</div>
                <div className="text-base font-bold text-amber-400 font-mono flex items-center gap-1">
                  <Coins className="w-4 h-4 fill-current" />
                  <span>+{lastResult.coinsEarned}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons: PLAY AGAIN & EXIT */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={onPlayAgain}
                className="w-full py-3.5 rounded-xl bg-[#78BE20] hover:bg-[#68a81b] text-white font-black text-xs uppercase tracking-wider active:scale-95 transition-transform shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                <span>PLAY AGAIN</span>
              </button>

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                EXIT
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="px-4 py-2 bg-[#1688C9] text-center text-xs text-white/90 border-t border-blue-600">
        EthioTelecom TelePlus • Official Mobile Gaming Portal
      </div>
    </div>
  );
};
