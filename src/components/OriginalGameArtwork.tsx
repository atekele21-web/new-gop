import React from 'react';

interface ArtworkProps {
  gameId: string;
  className?: string;
}

export const OriginalGameArtwork: React.FC<ArtworkProps> = ({ gameId, className = '' }) => {
  switch (gameId) {
    case 'candy-blast':
      return (
        <div className={`w-full h-full relative overflow-hidden bg-gradient-to-br from-[#0B3B70] via-[#1a0a2a] to-[#2d0824] flex items-center justify-center ${className}`}>
          {/* Sweet Honeycomb & Candy Constellation Background */}
          <svg className="w-full h-full absolute inset-0 opacity-40" viewBox="0 0 400 240" fill="none">
            <pattern id="candyHex" width="30" height="30" patternUnits="userSpaceOnUse">
              <polygon points="15,0 30,8 30,22 15,30 0,22 0,8" fill="none" stroke="#70C922" strokeWidth="1" opacity="0.25" />
            </pattern>
            <rect width="400" height="240" fill="url(#candyHex)" />
            <circle cx="80" cy="50" r="30" fill="#e11d48" opacity="0.2" filter="blur(20px)" />
            <circle cx="320" cy="180" r="40" fill="#70C922" opacity="0.25" filter="blur(25px)" />
            <circle cx="200" cy="120" r="50" fill="#f59e0b" opacity="0.15" filter="blur(30px)" />
          </svg>

          {/* Candy Jewels Cluster */}
          <div className="relative z-10 flex items-center gap-2.5 sm:gap-3.5">
            {/* Blue Star Drop */}
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-[#0B3B70] to-cyan-400 border border-white/60 flex items-center justify-center shadow-lg shadow-cyan-500/30 transform -rotate-12 group-hover:scale-105 transition-transform">
              <span className="text-base sm:text-lg">⭐</span>
            </div>

            {/* Central Honeycomb Heart Sweet */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 border-2 border-white flex flex-col items-center justify-center shadow-2xl shadow-rose-500/50 transform scale-110 group-hover:scale-115 transition-transform animate-pulse">
              <span className="text-2xl sm:text-3xl">🍬</span>
            </div>

            {/* Green Emerald Candy */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-[#70C922] to-emerald-400 border border-white/80 flex items-center justify-center shadow-lg shadow-[#70C922]/40 transform rotate-12 group-hover:scale-105 transition-transform">
              <span className="text-lg sm:text-xl">🍯</span>
            </div>
          </div>

          <div className="absolute bottom-2.5 px-3 py-0.5 rounded-full bg-slate-950/80 border border-rose-500/40 text-rose-300 text-[10px] font-black tracking-widest uppercase flex items-center gap-1">
            <span>✨</span> MATCH-3 SUGAR COMBO
          </div>
        </div>
      );

    case 'color-rush':
      return (
        <div className={`w-full h-full relative overflow-hidden bg-gradient-to-br from-[#05234A] via-[#0B3B70] to-[#041226] flex items-center justify-center ${className}`}>
          {/* Chromatic Speedway Rays */}
          <svg className="w-full h-full absolute inset-0 opacity-70" viewBox="0 0 400 240" fill="none">
            <defs>
              <linearGradient id="crGlow" x1="0" y1="0" x2="400" y2="240" gradientUnits="userSpaceOnUse">
                <stop stopColor="#70C922" />
                <stop offset="0.3" stopColor="#06b6d4" />
                <stop offset="0.7" stopColor="#f43f5e" />
                <stop offset="1" stopColor="#eab308" />
              </linearGradient>
            </defs>
            {/* Speed Tunnel Lines */}
            <circle cx="200" cy="120" r="100" stroke="url(#crGlow)" strokeWidth="1.5" strokeDasharray="8 8" opacity="0.4" />
            <circle cx="200" cy="120" r="70" stroke="#70C922" strokeWidth="2" opacity="0.6" />
            <circle cx="200" cy="120" r="40" stroke="#ffffff" strokeWidth="1" strokeDasharray="4 4" opacity="0.8" />
            <line x1="0" y1="0" x2="400" y2="240" stroke="#70C922" strokeWidth="1" opacity="0.3" />
            <line x1="400" y1="0" x2="0" y2="240" stroke="#06b6d4" strokeWidth="1" opacity="0.3" />
          </svg>

          {/* 4 Quadrant Neon Reflex Wheel */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl p-1 bg-slate-950/80 border-2 border-white/40 shadow-2xl shadow-[#70C922]/40 flex items-center justify-center transform group-hover:rotate-45 transition-transform duration-500">
              <div className="grid grid-cols-2 gap-1 w-full h-full p-1">
                <div className="rounded-tl-lg bg-[#70C922] shadow-sm animate-pulse" />
                <div className="rounded-tr-lg bg-cyan-400 shadow-sm" />
                <div className="rounded-bl-lg bg-rose-500 shadow-sm" />
                <div className="rounded-br-lg bg-amber-400 shadow-sm" />
              </div>
            </div>
            <div className="mt-2 px-3 py-0.5 rounded-full bg-[#05234A]/90 border border-[#70C922]/50 text-[#70C922] text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
              <span>⚡</span> REFLEX REACTION SPEED
            </div>
          </div>
        </div>
      );

    case 'world-legends':
      return (
        <div className={`w-full h-full relative overflow-hidden bg-gradient-to-br from-[#0B3B70] via-[#05234A] to-[#1e1505] flex items-center justify-center ${className}`}>
          {/* Historic Ancient World & Heritage Grid */}
          <svg className="w-full h-full absolute inset-0 opacity-40" viewBox="0 0 400 240" fill="none">
            {/* Constellation & Compass Lines */}
            <circle cx="200" cy="120" r="85" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.5" />
            <polygon points="200,45 210,110 275,120 210,130 200,195 190,130 125,120 190,110" fill="#f59e0b" opacity="0.15" />
            {/* Axum & Pyramids Silhouettes */}
            <path d="M40 220 L70 140 L100 220 Z" fill="#0B3B70" opacity="0.5" />
            <path d="M300 220 L330 150 L360 220 Z" fill="#0B3B70" opacity="0.5" />
            <rect x="190" y="70" width="20" height="150" fill="#f59e0b" opacity="0.2" />
          </svg>

          {/* Golden Knowledge Crest */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 border-2 border-yellow-100 p-0.5 shadow-2xl shadow-amber-500/40 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
              <div className="w-full h-full bg-[#05234A] rounded-[22px] flex items-center justify-center text-amber-300">
                <span className="text-3xl sm:text-4xl">🏛️</span>
              </div>
            </div>
            <div className="mt-2 px-3 py-0.5 rounded-full bg-[#05234A]/95 border border-amber-400/50 text-amber-300 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
              <span>👑</span> EPIC LORE & TRIVIA
            </div>
          </div>
        </div>
      );

    case 'pop-piano':
      return (
        <div className={`w-full h-full relative overflow-hidden bg-gradient-to-br from-[#0B3B70] via-[#1a0b3a] to-[#250640] flex items-center justify-center ${className}`}>
          {/* Falling Piano Keys & Rhythm Soundwaves */}
          <svg className="w-full h-full absolute inset-0 opacity-60" viewBox="0 0 400 240" fill="none">
            {/* 4 Rhythm Lanes */}
            <line x1="120" y1="0" x2="80" y2="240" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.4" />
            <line x1="170" y1="0" x2="160" y2="240" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.4" />
            <line x1="230" y1="0" x2="240" y2="240" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.4" />
            <line x1="280" y1="0" x2="320" y2="240" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.4" />
            {/* Hit Baseline Bar */}
            <line x1="60" y1="190" x2="340" y2="190" stroke="#70C922" strokeWidth="4" strokeLinecap="round" opacity="0.9" />
            {/* Falling Note Blocks */}
            <rect x="135" y="40" width="30" height="50" rx="6" fill="#8b5cf6" opacity="0.8" />
            <rect x="235" y="90" width="32" height="60" rx="6" fill="#70C922" opacity="0.9" />
            <rect x="90" y="130" width="28" height="45" rx="6" fill="#06b6d4" opacity="0.8" />
          </svg>

          {/* Glowing Synthesizer Key Motif */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-[#70C922] p-0.5 shadow-2xl shadow-purple-500/40 flex items-center justify-center transform group-hover:scale-110 transition-transform">
              <div className="w-full h-full bg-[#05234A] rounded-[14px] flex items-center justify-center text-3xl text-purple-300">
                🎹
              </div>
            </div>
            <div className="mt-2 px-3 py-0.5 rounded-full bg-[#05234A]/90 border border-purple-400/50 text-purple-200 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
              <span>🎵</span> RHYTHM BEAT ENGINE
            </div>
          </div>
        </div>
      );

    case 'hill-rider':
      return (
        <div className={`w-full h-full relative overflow-hidden bg-gradient-to-br from-[#05234A] via-[#0B3B70] to-[#041a30] flex items-center justify-center ${className}`}>
          {/* Highland Mountain Ridges Vector */}
          <svg className="w-full h-full absolute inset-0 opacity-80" viewBox="0 0 400 240" fill="none">
            {/* Distant Hills */}
            <path d="M0 130 Q120 70 220 110 T400 90 L400 240 L0 240 Z" fill="#072347" />
            {/* Foreground Steep Highland Ridge */}
            <path d="M0 180 Q80 120 160 170 T320 130 Q360 160 400 140 L400 240 L0 240 Z" fill="#0c3569" />
            <path d="M0 185 Q80 125 160 175 T320 135 Q360 165 400 145" stroke="#70C922" strokeWidth="4" fill="none" opacity="0.9" />
            {/* Sunburst */}
            <circle cx="340" cy="60" r="28" fill="#f59e0b" opacity="0.3" filter="blur(10px)" />
            <circle cx="340" cy="60" r="14" fill="#fbbf24" opacity="0.7" />
          </svg>

          {/* 4x4 Highland Buggy */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#70C922] via-[#0B3B70] to-cyan-500 p-0.5 shadow-2xl shadow-[#70C922]/30 flex items-center justify-center transform -rotate-6 group-hover:scale-110 transition-transform">
              <div className="w-full h-full bg-[#05234A] rounded-[14px] flex items-center justify-center text-3xl">
                🚙
              </div>
            </div>
            <div className="mt-2 px-3 py-0.5 rounded-full bg-[#05234A]/90 border border-[#70C922]/50 text-[#70C922] text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
              <span>⛰️</span> HIGHLAND PHYSICS RIDGE
            </div>
          </div>
        </div>
      );

    case 'pop-balloon':
      return (
        <div className={`w-full h-full relative overflow-hidden bg-gradient-to-br from-[#FAF7FC] via-[#F5EDF6] to-[#EBDDF0] flex items-center justify-center ${className}`}>
          {/* Subtle background decorative circle */}
          <svg className="w-full h-full absolute inset-0 opacity-60" viewBox="0 0 400 240" fill="none">
            <circle cx="200" cy="120" r="70" fill="#ffffff" stroke="#D8B4E2" strokeWidth="2" />
            <circle cx="90" cy="60" r="24" fill="#22C55E" opacity="0.8" />
            <circle cx="310" cy="160" r="26" fill="#3B82F6" opacity="0.8" />
            <circle cx="120" cy="180" r="22" fill="#EC4899" opacity="0.8" />
            <circle cx="280" cy="70" r="20" fill="#F59E0B" opacity="0.8" />
          </svg>

          {/* Central Pop Balloon Icon */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#EC4899] via-[#8B5CF6] to-[#3B82F6] p-0.5 shadow-xl shadow-purple-500/20 flex items-center justify-center transform group-hover:scale-110 transition-transform">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-3xl">
                🎈
              </div>
            </div>
            <div className="mt-2 px-3 py-0.5 rounded-full bg-white/90 border border-purple-300 text-purple-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm">
              <span>🟢</span> POP REFLEX ARCADE
            </div>
          </div>
        </div>
      );

    case 'archery-strike':
      return (
        <div className={`w-full h-full relative overflow-hidden bg-gradient-to-br from-[#05234A] via-[#0B3B70] to-[#1688C9] flex items-center justify-center ${className}`}>
          {/* Target Archery Rings */}
          <svg className="w-full h-full absolute inset-0 opacity-75" viewBox="0 0 400 240" fill="none">
            <circle cx="200" cy="120" r="95" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" />
            <circle cx="200" cy="120" r="75" fill="#0f172a" stroke="#334155" strokeWidth="2" />
            <circle cx="200" cy="120" r="55" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
            <circle cx="200" cy="120" r="35" fill="#dc2626" stroke="#f87171" strokeWidth="2" />
            <circle cx="200" cy="120" r="16" fill="#fbbf24" stroke="#fef08a" strokeWidth="2" />
            {/* Crosshairs */}
            <line x1="200" y1="20" x2="200" y2="220" stroke="#8BCB3D" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.8" />
            <line x1="100" y1="120" x2="300" y2="120" stroke="#8BCB3D" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.8" />
          </svg>

          {/* Archery Bow & Bullseye Target Emblem */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#8BCB3D] via-[#1688C9] to-amber-400 p-0.5 shadow-2xl shadow-blue-900/50 flex items-center justify-center transform group-hover:scale-110 transition-transform">
              <div className="w-full h-full bg-[#05234A] rounded-[14px] flex items-center justify-center text-3xl">
                🎯
              </div>
            </div>
            <div className="mt-2 px-3 py-0.5 rounded-full bg-[#05234A]/90 border border-[#8BCB3D]/50 text-[#8BCB3D] text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm">
              <span>🏹</span> PRECISION 3D TARGET
            </div>
          </div>
        </div>
      );

    case 'addis-runner':
      return (
        <div className={`w-full h-full relative overflow-hidden bg-gradient-to-br from-[#0B3B70] via-[#05234A] to-[#04162e] flex items-center justify-center ${className}`}>
          <svg className="w-full h-full absolute inset-0 opacity-80" viewBox="0 0 400 240" fill="none">
            <path d="M0 130 Q100 80 200 110 T400 90 L400 240 L0 240 Z" fill="#072042" />
            <path d="M0 150 Q120 110 240 140 T400 130 L400 240 L0 240 Z" fill="#092d5c" />
            <polygon points="170,140 230,140 380,240 20,240" fill="#0d3c75" opacity="0.5" />
            <line x1="200" y1="140" x2="200" y2="240" stroke="#70C922" strokeWidth="3" strokeDasharray="12 8" />
          </svg>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#70C922] to-[#0B3B70] p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-[#05234A] rounded-[14px] flex items-center justify-center text-3xl">
                🏃
              </div>
            </div>
            <div className="mt-2 px-2.5 py-0.5 rounded-full bg-[#70C922]/20 border border-[#70C922]/50 text-[#70C922] text-[10px] font-black uppercase">
              5G SPEED PARKOUR
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className={`w-full h-full bg-gradient-to-br from-[#0B3B70] to-[#05234A] flex items-center justify-center ${className}`}>
          <span className="text-4xl">🎮</span>
        </div>
      );
  }
};
