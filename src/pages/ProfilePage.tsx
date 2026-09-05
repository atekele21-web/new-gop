/**
 * EthioTelecom Customer Profile & Secondary Pages for TelePlus
 * 
 * Strict Specification:
 * Top:
 * - Masked MSISDN (5 middle digits masked: 091*****890)
 * - 4 Information Cards:
 *   1. Available Coins
 *   2. Weekly Points
 *   3. Monthly Points
 *   4. Rank
 * 
 * Below:
 * Clean icon rows for exactly:
 * 1. My Games
 * 2. My Scores
 * 3. My Rewards
 * 4. My Rank
 * 5. Subscriptions
 * 6. Help & Support
 * 7. FAQ
 * 8. Settings (includes Language switcher)
 * 9. About
 * 10. Terms & Conditions
 * 11. Privacy Policy
 * 12. Logout
 */

import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  LanguageCode,
  GameDefinition,
  EnergyTransaction,
  ClaimableReward,
  SubscriptionPlan
} from '../types';
import {
  Phone,
  Gamepad2,
  Trophy,
  Gift,
  Crown,
  CreditCard,
  Headphones,
  HelpCircle,
  Settings as SettingsIcon,
  Info,
  FileText,
  ShieldCheck,
  LogOut,
  ArrowLeft,
  ChevronRight,
  Send,
  Volume2,
  VolumeX,
  Wallet,
  Coins,
  BadgePercent
} from 'lucide-react';
import { SUBSCRIPTION_PLANS, PlanDetails } from '../services/subscriptionService';
import { maskMiddleFiveDigits } from './LeaderboardPage';
import { GamesContentPage } from './content/GamesContentPage';
import { PricingPage } from './content/PricingPage';
import { FAQPage } from './content/FAQPage';
import { HelpSupportPage } from './content/HelpSupportPage';
import { SubscriptionPage } from './content/SubscriptionPage';
import { TermsPage } from './content/TermsPage';
import { PrivacyPage } from './content/PrivacyPage';

export type ProfileSubView =
  | null
  | 'games'
  | 'pricing'
  | 'my_games'
  | 'my_scores'
  | 'my_rewards'
  | 'my_rank'
  | 'subscriptions'
  | 'help_support'
  | 'faq'
  | 'settings'
  | 'about'
  | 'terms'
  | 'privacy';

interface ProfilePageProps {
  profile: UserProfile;
  games: GameDefinition[];
  energyTransactions?: EnergyTransaction[];
  claimableRewards?: ClaimableReward[];
  language?: LanguageCode;
  onLanguageChange?: (lang: LanguageCode) => void;
  onOpenEnergyModal?: () => void;
  onOpenSubscriptionModal?: () => void;
  onOpenAuthModal?: () => void;
  onOpenLegalModal?: (tab: 'terms' | 'privacy' | 'datasafety' | 'delete_account') => void;
  onPlayGame: (game: GameDefinition) => void;
  onClaimReward?: (rewardId: string) => void;
  onSignOut: () => void;
  onResetDemo?: () => void;
  onWipeData?: () => void;
  audioEnabled?: boolean;
  onToggleAudio?: () => void;
  hapticsEnabled?: boolean;
  onToggleHaptics?: () => void;
  notifsEnabled?: boolean;
  onToggleNotifs?: () => void;
  lowDataMode?: boolean;
  onToggleLowDataMode?: () => void;
  onSubscribePlan?: (plan: SubscriptionPlan) => void;
  onPurchaseCoinsPackage?: (coins: number, costETB: number) => void;
  t?: Record<string, any>;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  profile,
  games,
  claimableRewards = [],
  language = 'en',
  onLanguageChange,
  onOpenEnergyModal,
  onPlayGame,
  onClaimReward,
  onSignOut,
  audioEnabled = true,
  onToggleAudio,
  onSubscribePlan,
}) => {
  const [subView, setSubView] = useState<ProfileSubView>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Browser/Android Back Button Handler for Secondary Views
  useEffect(() => {
    const handlePopState = () => {
      if (subView !== null) {
        setSubView(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [subView]);

  const navigateTo = (view: ProfileSubView) => {
    if (view !== null) {
      window.history.pushState({ profileSubView: view }, '');
    }
    setSubView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToMenu = () => {
    setSubView(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const maskedMsisdn = maskMiddleFiveDigits(profile.phoneNumber || '0911428890');
  
  // Weekly & Monthly Score Calculations
  const weeklyScore = 
    Math.min(400, profile.highScores?.['candy-blast'] || 0) + 
    Math.min(400, profile.highScores?.['color-rush'] || 0) + 
    Math.min(400, profile.highScores?.['pop-piano'] || 0);

  const monthlyScore = 
    Math.min(400, profile.highScores?.['world-legends'] || 0) + 
    Math.min(400, profile.highScores?.['hill-rider'] || 0) + 
    Math.min(400, profile.highScores?.['archery-strike'] || 0);

  const handleTriggerSms = (recipient: string, body: string, planId: SubscriptionPlan) => {
    if (onSubscribePlan) {
      onSubscribePlan(planId);
    }
    try {
      window.location.href = `sms:${recipient}?body=${encodeURIComponent(body)}`;
    } catch (e) {
      console.warn('SMS dispatch', e);
    }
  };

  // =========================================================================
  // VIEW: LOGOUT CONFIRMATION DIALOG
  // =========================================================================
  const renderLogoutModal = () => {
    if (!showLogoutModal) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in select-none">
        <div className="w-full max-w-xs bg-white rounded-2xl p-5 border border-slate-200 shadow-2xl text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center border border-rose-100">
            <LogOut className="w-6 h-6 stroke-[2.5]" />
          </div>

          <div>
            <h3 className="text-base font-black text-[#17202A]">Log Out</h3>
            <p className="text-xs text-[#6B7280] mt-1">
              Your high scores and coins remain saved to your EthioTelecom account.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              onClick={() => setShowLogoutModal(false)}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#17202A] font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={() => {
                setShowLogoutModal(false);
                onSignOut();
              }}
              className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition-colors shadow-xs cursor-pointer"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Secondary Pages Header
  const renderSecondaryHeader = (title: string, icon: React.ReactNode) => (
    <div className="flex items-center gap-3 bg-[#1688C9] text-white p-3.5 rounded-2xl shadow-xs mb-4">
      <button
        onClick={handleBackToMenu}
        className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
        title="Back to Profile"
      >
        <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
      </button>
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-base font-black tracking-tight">{title}</h2>
      </div>
    </div>
  );

  // =========================================================================
  // MAIN PROFILE VIEW
  // =========================================================================
  if (subView === null) {
    return (
      <div className="min-h-screen bg-white text-[#17202A] pb-24 max-w-md md:max-w-xl lg:max-w-3xl mx-auto px-3.5 pt-3 space-y-4 select-none">
        {renderLogoutModal()}

        {/* 1. TOP: Masked MSISDN Card */}
        <div 
          id="profile-msisdn-card"
          className="rounded-2xl bg-[#1688C9] text-white p-4 shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 text-[#8BCB3D] flex items-center justify-center font-black">
                <Phone className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="text-[9px] text-blue-100 font-bold uppercase tracking-wider">
                  EthioTelecom Account
                </div>
                <div className="text-base font-black font-mono tracking-wider text-white">
                  {maskedMsisdn}
                </div>
              </div>
            </div>

            <span className="px-2.5 py-0.5 rounded-full bg-[#8BCB3D] text-white text-[9px] font-black uppercase tracking-wider shadow-xs">
              ACTIVE
            </span>
          </div>

          {/* 4 Info Cards: Available Coins | Weekly Points | Monthly Points | Rank */}
          <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-white/15">
            <div className="text-center p-1.5 rounded-xl bg-white/10">
              <div className="text-[8px] font-bold text-blue-100 uppercase">Coins</div>
              <div className="text-xs font-black font-mono text-white mt-0.5 flex items-center justify-center gap-0.5">
                <Coins className="w-3 h-3 text-[#8BCB3D] fill-current" />
                <span>{profile.coins ?? 25}</span>
              </div>
            </div>

            <div className="text-center p-1.5 rounded-xl bg-white/10">
              <div className="text-[8px] font-bold text-blue-100 uppercase">Weekly</div>
              <div className="text-xs font-black font-mono text-white mt-0.5">
                {weeklyScore}
              </div>
            </div>

            <div className="text-center p-1.5 rounded-xl bg-white/10">
              <div className="text-[8px] font-bold text-blue-100 uppercase">Monthly</div>
              <div className="text-xs font-black font-mono text-white mt-0.5">
                {monthlyScore}
              </div>
            </div>

            <div className="text-center p-1.5 rounded-xl bg-white/10">
              <div className="text-[8px] font-bold text-blue-100 uppercase">Rank</div>
              <div className="text-xs font-black font-mono text-[#8BCB3D] mt-0.5">
                #4
              </div>
            </div>
          </div>
        </div>

        {/* 2. BELOW: Clean Icon Rows */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-100">
          {[
            { id: 'games', label: 'Games', icon: Gamepad2 },
            { id: 'pricing', label: 'Pricing', icon: BadgePercent },
            { id: 'my_games', label: 'My Games', icon: Gamepad2 },
            { id: 'my_scores', label: 'My Scores', icon: Trophy },
            { id: 'my_rewards', label: 'My Rewards', icon: Gift },
            { id: 'my_rank', label: 'My Rank', icon: Crown },
            { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
            { id: 'help_support', label: 'Help & Support', icon: Headphones },
            { id: 'faq', label: 'FAQ', icon: HelpCircle },
            { id: 'settings', label: 'Settings', icon: SettingsIcon },
            { id: 'about', label: 'About', icon: Info },
            { id: 'terms', label: 'Terms & Conditions', icon: FileText },
            { id: 'privacy', label: 'Privacy Policy', icon: ShieldCheck },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                id={`profile-menu-${item.id}`}
                onClick={() => navigateTo(item.id as ProfileSubView)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1688C9] flex items-center justify-center group-hover:bg-[#1688C9] group-hover:text-white transition-colors">
                    <Icon className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <span className="text-xs sm:text-sm font-black text-[#17202A] group-hover:text-[#1688C9] transition-colors">
                    {item.label}
                  </span>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-400 stroke-[2.5] group-hover:text-[#1688C9] transition-transform" />
              </button>
            );
          })}

          {/* 12. Logout */}
          <button
            id="profile-menu-logout"
            onClick={() => setShowLogoutModal(true)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-rose-50 transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
                <LogOut className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-xs sm:text-sm font-black text-rose-600">Logout</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 stroke-[2.5] group-hover:text-rose-600 transition-colors" />
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SECONDARY PAGES VIEW
  // =========================================================================
  return (
    <div className="min-h-screen bg-white text-[#17202A] pb-24 max-w-md md:max-w-xl lg:max-w-3xl mx-auto px-3.5 pt-3 select-none">
      {renderLogoutModal()}

      {/* 0. GAMES (CANONICAL FULL PAGE) */}
      {subView === 'games' && (
        <div className="space-y-3 animate-in fade-in">
          <GamesContentPage
            games={games}
            profile={profile}
            onLaunchGame={onPlayGame}
            onBack={handleBackToMenu}
            showHeader={true}
          />
        </div>
      )}

      {/* 0.1 PRICING (CANONICAL FULL PAGE) */}
      {subView === 'pricing' && (
        <div className="space-y-3 animate-in fade-in">
          <PricingPage
            onBack={handleBackToMenu}
            showHeader={true}
            onSubscribeSms={(recipient, body) => {
              window.location.href = `sms:${recipient}?body=${encodeURIComponent(body)}`;
            }}
          />
        </div>
      )}

      {/* 1. MY GAMES */}
      {subView === 'my_games' && (
        <div className="space-y-3 animate-in fade-in">
          {renderSecondaryHeader('My Games', <Gamepad2 className="w-4 h-4 text-[#8BCB3D]" />)}

          <div className="space-y-2.5">
            {games.map((game) => {
              const personalBest = profile.highScores[game.id] || 0;
              return (
                <div
                  key={game.id}
                  className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={game.thumbnailUrl}
                      alt={game.title}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-[#17202A]">{game.title}</h4>
                      <div className="text-[10px] text-[#6B7280]">{game.genre}</div>
                      <div className="text-[11px] text-[#1688C9] font-mono font-black mt-0.5">
                        Best: {personalBest} / 400 PTS
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onPlayGame(game)}
                    className="px-3.5 py-2 rounded-xl bg-[#8BCB3D] hover:bg-[#7cb736] text-white font-black text-xs uppercase cursor-pointer shadow-xs"
                  >
                    Play
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. MY SCORES */}
      {subView === 'my_scores' && (
        <div className="space-y-3 animate-in fade-in">
          {renderSecondaryHeader('My Scores', <Trophy className="w-4 h-4 text-amber-400" />)}

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-4 py-2.5 bg-[#1688C9] text-white flex items-center justify-between text-[11px] font-black uppercase tracking-wider">
              <span>Game Title</span>
              <span>Best Score (Max 400)</span>
            </div>

            <div className="divide-y divide-slate-100">
              {games.map((g) => {
                const score = profile.highScores[g.id] || 0;
                return (
                  <div key={g.id} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <div className="text-xs sm:text-sm font-black text-[#17202A]">{g.title}</div>
                      <div className="text-[10px] text-[#6B7280]">{g.genre}</div>
                    </div>
                    <div className="font-mono font-black text-xs sm:text-sm text-[#1688C9]">
                      {score} PTS
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. MY REWARDS */}
      {subView === 'my_rewards' && (
        <div className="space-y-3 animate-in fade-in">
          {renderSecondaryHeader('My Rewards', <Gift className="w-4 h-4 text-amber-300" />)}

          <div className="space-y-2.5">
            {claimableRewards.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 text-[#6B7280] text-xs">
                Finish in the Top 10 in Weekly or Monthly tournaments to win cash & airtime rewards.
              </div>
            ) : (
              claimableRewards.map((reward) => (
                <div
                  key={reward.id}
                  className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-black text-xs">
                      #{reward.rank}
                    </div>
                    <div>
                      <div className="text-xs font-black text-[#17202A]">{reward.rewardText}</div>
                      <div className="text-[10px] text-[#6B7280]">
                        {reward.claimed ? 'Claimed via TeleBirr' : 'Ready to Claim'}
                      </div>
                    </div>
                  </div>

                  {!reward.claimed && onClaimReward && (
                    <button
                      onClick={() => onClaimReward(reward.id)}
                      className="px-3 py-1.5 rounded-xl bg-[#8BCB3D] text-white font-black text-xs shadow-xs cursor-pointer"
                    >
                      Claim
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. MY RANK */}
      {subView === 'my_rank' && (
        <div className="space-y-3 animate-in fade-in">
          {renderSecondaryHeader('My Rank', <Crown className="w-4 h-4 text-amber-400" />)}

          <div className="grid grid-cols-2 gap-2.5 text-center">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <div className="text-[9px] text-[#6B7280] font-bold uppercase">Weekly Tournament</div>
              <div className="text-xl font-black text-[#1688C9] font-mono mt-1">#4</div>
              <div className="text-[9px] text-[#8BCB3D] font-bold mt-0.5">Top 10 Prize Tier</div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <div className="text-[9px] text-[#6B7280] font-bold uppercase">Monthly Grand</div>
              <div className="text-xl font-black text-[#1688C9] font-mono mt-1">#8</div>
              <div className="text-[9px] text-[#8BCB3D] font-bold mt-0.5">Active Finalist</div>
            </div>
          </div>
        </div>
      )}

      {/* 5. SUBSCRIPTIONS (CANONICAL FULL COMPONENT) */}
      {subView === 'subscriptions' && (
        <div className="space-y-3 animate-in fade-in">
          <SubscriptionPage
            onBack={handleBackToMenu}
            showHeader={true}
            onSubscribeSms={(recipient, body) => {
              window.location.href = `sms:${recipient}?body=${encodeURIComponent(body)}`;
            }}
          />
        </div>
      )}

      {/* 6. HELP & SUPPORT (CANONICAL ACCORDION COMPONENT) */}
      {subView === 'help_support' && (
        <div className="space-y-3 animate-in fade-in">
          <HelpSupportPage
            onBack={handleBackToMenu}
            showHeader={true}
          />
        </div>
      )}

      {/* 7. FAQ (CANONICAL ACCORDION COMPONENT) */}
      {subView === 'faq' && (
        <div className="space-y-3 animate-in fade-in">
          <FAQPage
            onBack={handleBackToMenu}
            showHeader={true}
          />
        </div>
      )}

      {/* 8. SETTINGS (INCLUDES LANGUAGE SELECTOR) */}
      {subView === 'settings' && (
        <div className="space-y-3 animate-in fade-in">
          {renderSecondaryHeader('Settings', <SettingsIcon className="w-4 h-4 text-slate-200" />)}

          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-xs">
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {audioEnabled ? <Volume2 className="w-5 h-5 text-[#1688C9]" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
                <div>
                  <div className="text-xs font-black text-[#17202A]">Sound Effects & Audio</div>
                  <div className="text-[10px] text-[#6B7280]">In-game sound effects</div>
                </div>
              </div>
              <button
                onClick={onToggleAudio}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  audioEnabled ? 'bg-[#8BCB3D]' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-xs absolute top-1 transition-transform ${
                    audioEnabled ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {onLanguageChange && (
              <div className="p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-[#17202A]">Language / ቋንቋ</div>
                  <div className="text-[10px] text-[#6B7280]">Select interface language</div>
                </div>
                <select
                  value={language}
                  onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-[#17202A] focus:outline-none"
                >
                  <option value="en">English</option>
                  <option value="am">አማርኛ (Amharic)</option>
                  <option value="om">Afaan Oromoo</option>
                  <option value="ti">ትግርኛ (Tigrinya)</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 9. ABOUT */}
      {subView === 'about' && (
        <div className="space-y-3 animate-in fade-in">
          {renderSecondaryHeader('About TelePlus', <Info className="w-4 h-4 text-blue-200" />)}

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3 text-xs text-[#17202A] leading-relaxed">
            <h4 className="text-sm font-black text-[#1688C9]">About TelePlus</h4>
            <p>
              TelePlus is an Ethio Telecom digital entertainment platform bringing together mobile games, premium content, subscriptions, rewards, and convenient digital services in one simple experience.
            </p>
            <p>
              Explore games, discover entertainment services, subscribe to available packages, and enjoy a convenient digital experience designed for Ethio Telecom customers.
            </p>
          </div>
        </div>
      )}

      {/* 10. TERMS & CONDITIONS (CANONICAL 32 SECTIONS COMPONENT) */}
      {subView === 'terms' && (
        <div className="space-y-3 animate-in fade-in">
          <TermsPage
            onBack={handleBackToMenu}
            showHeader={true}
          />
        </div>
      )}

      {/* 11. PRIVACY POLICY (CANONICAL COMPONENT) */}
      {subView === 'privacy' && (
        <div className="space-y-3 animate-in fade-in">
          <PrivacyPage
            onBack={handleBackToMenu}
            showHeader={true}
          />
        </div>
      )}
    </div>
  );
};
