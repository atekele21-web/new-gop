/**
 * Global Top Header / Branding Area for TelePlus (Ethio Telecom)
 * 
 * Strict Layout:
 * [ ETHIO TELECOM LOGO ]       [ TelePlus ]       [ BUY COINS ]
 * 
 * Features:
 * - Single horizontal row on all mobile and desktop screen sizes
 * - Official Ethio Telecom logo on left
 * - Pure "TelePlus" wordmark centered (no "ETHIO" tag)
 * - Premium green "BUY COINS" pill button on right
 * - Clean white background with refined depth and elevation
 * - Balanced vertical breathing room
 */

import React from 'react';
import { UserProfile } from '../types';
import { EthioTelecomLogo } from './EthioTelecomLogo';
import { Menu, Coins } from 'lucide-react';

interface HeaderProps {
  profile?: UserProfile;
  onOpenMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  onOpenMenu,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.04)] select-none">
      <div className="max-w-md md:max-w-xl lg:max-w-3xl mx-auto px-3.5 sm:px-4 py-3 sm:py-3.5 flex items-center justify-between gap-2 min-h-[64px]">
        {/* 1. LEFT: Menu button & Official Ethio Telecom Branding */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenMenu && (
            <button
              id="header-main-menu-btn"
              type="button"
              onClick={onOpenMenu}
              aria-label="Open TelePlus Menu"
              className="p-1.5 rounded-xl text-[#17202A] hover:bg-slate-100 active:scale-95 transition-colors cursor-pointer"
              title="Menu"
            >
              <Menu className="w-5 h-5 stroke-[2.2]" />
            </button>
          )}

          <div 
            id="header-brand-logo"
            className="flex items-center cursor-pointer shrink-0 transition-opacity hover:opacity-90 active:scale-98" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            title="Ethio Telecom"
          >
            <EthioTelecomLogo size="md" />
          </div>
        </div>

        {/* 2. CENTER: TelePlus Portal Visual Identity (No "ETHIO" text) */}
        <div 
          id="header-teleplus-title"
          className="flex items-center justify-center text-center cursor-pointer px-1 shrink-0 transition-transform active:scale-98"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="TelePlus Gaming Portal"
        >
          <span className="text-[17px] sm:text-[20px] font-black tracking-tight text-[#17202A] select-none">
            Tele<span className="text-[#0072CE]">Plus</span>
          </span>
        </div>

        {/* 3. RIGHT: Player Coins Balance Indicator (Non-purchasable display) */}
        <div className="flex items-center justify-end shrink-0">
          <div
            id="header-coins-badge"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-[#17202A] text-xs font-bold font-mono shadow-xs"
            title="Your Coins Balance"
          >
            <Coins className="w-3.5 h-3.5 text-amber-500 fill-current" />
            <span>{profile?.coins ?? 25}</span>
            <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Coins</span>
          </div>
        </div>
      </div>
    </header>
  );
};

