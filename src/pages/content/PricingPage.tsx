/**
 * Pricing Page Component for TelePlus
 * 
 * Verbatim content from Document Section 11:
 * - 11.1 Subscription Pricing (Daily 5 ETB, Weekly 15 ETB, Monthly 35 ETB)
 * - 11.2 Coin Pricing (5 coins 3 ETB, 10 coins 5 ETB, 25 coins 10 ETB)
 * - 11.3 Welcome Bonus (25 free coins for first-time registration)
 * - 11.4 Prize Money (Top-10 prize structure table: 50,000 ETB to 3,000 ETB, Total 233,000 ETB)
 */

import React from 'react';
import { 
  BadgePercent, 
  ArrowLeft, 
  Coins, 
  Trophy, 
  Gift, 
  CheckCircle2, 
  Sparkles, 
  CreditCard,
  Send
} from 'lucide-react';
import { 
  TELEPLUS_SUBSCRIPTION_PACKAGES, 
  TELEPLUS_COIN_PRICING, 
  TELEPLUS_WELCOME_BONUS, 
  TELEPLUS_TOP10_PRIZES,
  TELEPLUS_TOTAL_PRIZE_VALUE 
} from '../../data/teleplusContent';

interface PricingPageProps {
  onBack?: () => void;
  showHeader?: boolean;
  onSubscribeSms?: (recipient: string, body: string) => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({
  onBack,
  showHeader = true,
  onSubscribeSms,
}) => {
  const handleSmsTrigger = (recipient: string, body: string) => {
    if (onSubscribeSms) {
      onSubscribeSms(recipient, body);
    } else {
      window.location.href = `sms:${recipient}?body=${encodeURIComponent(body)}`;
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#17202A] pb-24 max-w-md md:max-w-xl lg:max-w-3xl mx-auto px-3.5 pt-3 select-none">
      {/* 1. Header with Back Button */}
      {showHeader && (
        <div className="flex items-center justify-between gap-3 bg-[#1688C9] text-white p-3.5 rounded-2xl shadow-xs mb-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                id="pricing-back-btn"
                onClick={onBack}
                className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
                title="Go Back"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <BadgePercent className="w-5 h-5 text-amber-300 shrink-0" />
              <h1 className="text-base font-black tracking-tight">Pricing & Price</h1>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* =========================================================================
            SECTION 1: SUBSCRIPTION PRICING
           ========================================================================= */}
        <section className="space-y-2.5">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#1688C9]" />
            <h2 className="text-xs font-black text-[#17202A] uppercase tracking-wider">
              1. Subscription Pricing
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {TELEPLUS_SUBSCRIPTION_PACKAGES.map((pkg) => (
              <div
                key={pkg.package}
                className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs flex flex-col justify-between text-center space-y-2"
              >
                <div>
                  <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
                    {pkg.package}
                  </span>
                  <div className="text-sm sm:text-base font-black text-[#1688C9] font-mono mt-0.5">
                    {pkg.price}
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 font-mono bg-slate-50 py-1 px-1 rounded-lg border border-slate-100">
                  SMS {pkg.smsBody} to 977
                </div>

                <button
                  onClick={() => handleSmsTrigger(pkg.recipient, pkg.smsBody)}
                  className="w-full py-1.5 rounded-xl bg-[#8BCB3D] hover:bg-[#7cb736] text-white font-black text-[11px] uppercase tracking-wider shadow-xs cursor-pointer"
                >
                  Subscribe
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================================
            SECTION 2: WELCOME BONUS
           ========================================================================= */}
        <section className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs space-y-1">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-white" />
            <h3 className="text-xs font-black uppercase tracking-wider">
              2. Welcome Bonus
            </h3>
          </div>
          <p className="text-xs font-medium text-amber-50">
            {TELEPLUS_WELCOME_BONUS.description}
          </p>
        </section>

        {/* =========================================================================
            SECTION 3: TOP-10 PRIZE MONEY TABLE
           ========================================================================= */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs font-black text-[#17202A] uppercase tracking-wider">
                4. Prize Money (Top 10)
              </h2>
            </div>
            <span className="text-[10px] font-bold text-[#6B7280]">
              Total Pool: 233,000 ETB
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-4 py-2.5 bg-[#1688C9] text-white flex items-center justify-between text-[11px] font-black uppercase tracking-wider">
              <span>Leaderboard Rank</span>
              <span>Tournament Prize</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {TELEPLUS_TOP10_PRIZES.map((item, idx) => (
                <div
                  key={item.rank}
                  className={`px-4 py-2.5 flex items-center justify-between ${
                    idx < 3 ? 'bg-amber-50/40 font-bold' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[11px] font-mono ${
                        idx === 0
                          ? 'bg-amber-400 text-slate-900'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-900'
                          : idx === 2
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <span className="text-[#17202A]">{item.rank} Place</span>
                  </div>

                  <span className="font-mono font-black text-[#1688C9] text-xs sm:text-sm">
                    {item.prize}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-600 font-medium text-center">
              {TELEPLUS_TOTAL_PRIZE_VALUE}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
