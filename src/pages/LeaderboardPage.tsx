/**
 * Official Leaderboard & Rankings Page for TelePlus (EthioTelecom)
 * 
 * Strict Specification:
 * - Tournament banner
 * - [ WEEKLY ] [ MONTHLY ] simple tabs
 * - Top 10 ONLY
 * - Columns: Rank, Player, Score, Reward
 * - Player format: MASKED MSISDN (091*****123, middle 5 digits masked)
 * - Rewards strictly in ETB:
 *   1 — 50K ETB, 2 — 40K ETB, 3 — 35K ETB, 4 — 30K ETB, 5 — 25K ETB,
 *   6 — 20K ETB, 7 — 15K ETB, 8 — 10K ETB, 9 — 5K ETB, 10 — 3K ETB
 * - ZERO forbidden words ("National Ranking", "Deterministic Ranking", "Package", etc.)
 */

import React, { useState } from 'react';
import { 
  LeaderboardPeriod, 
  UserProfile, 
  GameDefinition, 
} from '../types';
import { CompetitiveService } from '../services/competitiveService';
import { 
  Trophy, 
  Award,
  Sparkles
} from 'lucide-react';

interface LeaderboardPageProps {
  profile: UserProfile;
  games?: GameDefinition[];
  onPlayGame?: (game: GameDefinition, tournamentId?: string) => void;
  periodLabels?: Record<string, string>;
}

// Strict reward mapping as per requirement
const TOP_10_REWARDS: Record<number, string> = {
  1: '50K ETB',
  2: '40K ETB',
  3: '35K ETB',
  4: '30K ETB',
  5: '25K ETB',
  6: '20K ETB',
  7: '15K ETB',
  8: '10K ETB',
  9: '5K ETB',
  10: '3K ETB',
};

// Mask middle 5 digits: e.g. 091*****123
export const maskMiddleFiveDigits = (phone?: string): string => {
  const digits = (phone || '0911428890').replace(/\D/g, '');
  if (digits.length >= 9) {
    const start = digits.slice(0, 3);
    const end = digits.slice(-3);
    return `${start}*****${end}`;
  }
  return '091*****123';
};

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({
  profile,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<LeaderboardPeriod>('weekly');

  const leaderboardData = CompetitiveService.getLeaderboard(selectedPeriod, profile);
  const { entries, userRank, userTotalPoints } = leaderboardData;

  // Strict Top 10 only
  const topTenEntries = entries.slice(0, 10);

  return (
    <div className="min-h-screen bg-white text-[#17202A] pb-24 select-none">
      <div className="max-w-md md:max-w-xl lg:max-w-3xl mx-auto px-3.5 pt-3 space-y-4">
        
        {/* =========================================================================
            1. PLAYER RANKINGS BANNER
           ========================================================================= */}
        <section 
          id="leaderboard-promo-banner"
          className="relative rounded-2xl bg-[#1688C9] text-white p-4 shadow-sm overflow-hidden"
        >
          <div className="relative z-10 space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#8BCB3D] text-white text-[9px] font-black uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>PLAYER RANKINGS</span>
            </div>

            <h2 className="text-base sm:text-lg font-black text-white leading-tight">
              {selectedPeriod === 'weekly' ? 'Weekly Player Rankings' : 'Monthly Grand Rankings'}
            </h2>

            <p className="text-[11px] text-blue-50">
              Top players ranked by high scores and gameplay consistency.
            </p>
          </div>
        </section>

        {/* =========================================================================
            2. SIMPLE TABS: [ WEEKLY ] [ MONTHLY ]
           ========================================================================= */}
        <section id="leaderboard-tab-selector">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 border border-slate-200">
            <button
              id="leaderboard-tab-weekly"
              onClick={() => setSelectedPeriod('weekly')}
              className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                selectedPeriod === 'weekly'
                  ? 'bg-[#8BCB3D] text-white shadow-xs'
                  : 'bg-transparent text-[#17202A] hover:text-[#1688C9]'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>WEEKLY</span>
            </button>

            <button
              id="leaderboard-tab-monthly"
              onClick={() => setSelectedPeriod('monthly')}
              className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                selectedPeriod === 'monthly'
                  ? 'bg-[#8BCB3D] text-white shadow-xs'
                  : 'bg-transparent text-[#17202A] hover:text-[#1688C9]'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>MONTHLY</span>
            </button>
          </div>
        </section>

        {/* =========================================================================
            3. TOP 10 PLAYERS TABLE
               COLUMNS: Rank | Player | Score | Reward
           ========================================================================= */}
        <section id="leaderboard-top-10-table" className="space-y-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            
            {/* Table Header Columns */}
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 grid grid-cols-12 items-center text-[10px] sm:text-xs font-black text-[#17202A] uppercase tracking-wider">
              <span className="col-span-2 text-left">RANK</span>
              <span className="col-span-4 text-left">PLAYER</span>
              <span className="col-span-3 text-right">SCORE</span>
              <span className="col-span-3 text-right">REWARD</span>
            </div>

            {/* Top 10 Rows */}
            <div className="divide-y divide-slate-100">
              {topTenEntries.map((entry) => {
                const isCurrentUser = entry.userId === profile.id;
                const maskedMsisdn = maskMiddleFiveDigits(entry.phoneNumberMasked || `0911${entry.rank}4288`);
                const rewardText = TOP_10_REWARDS[entry.rank] || `${entry.rank}K ETB`;

                return (
                  <div
                    key={entry.rank}
                    id={`leaderboard-row-${entry.rank}`}
                    className={`px-4 py-3 grid grid-cols-12 items-center transition-colors ${
                      isCurrentUser
                        ? 'bg-blue-50/70 border-l-4 border-l-[#1688C9]'
                        : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    {/* 1. Rank */}
                    <div className="col-span-2 flex items-center">
                      <span 
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black font-mono shadow-xs ${
                          entry.rank === 1
                            ? 'bg-amber-400 text-slate-950'
                            : entry.rank === 2
                            ? 'bg-slate-300 text-slate-900'
                            : entry.rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-100 text-[#17202A]'
                        }`}
                      >
                        {entry.rank}
                      </span>
                    </div>

                    {/* 2. Player (Masked MSISDN) */}
                    <div className="col-span-4 min-w-0 pr-1">
                      <div className="text-xs font-black text-[#17202A] font-mono truncate flex items-center gap-1">
                        <span>{maskedMsisdn}</span>
                        {isCurrentUser && (
                          <span className="px-1 py-0.2 rounded bg-[#1688C9] text-white text-[8px] font-black uppercase font-sans">
                            YOU
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 3. Score */}
                    <div className="col-span-3 text-right font-mono font-black text-xs sm:text-sm text-[#1688C9]">
                      {entry.score.toLocaleString()}
                    </div>

                    {/* 4. Reward in ETB */}
                    <div className="col-span-3 text-right font-black text-xs text-[#8BCB3D]">
                      {rewardText}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
