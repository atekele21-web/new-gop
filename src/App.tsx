/**
 * TelePlay Ethiopia - Official EthioTelecom Gaming Hub
 * Main Application Orchestrator
 */

import React, { useState, useEffect } from 'react';
import { usePortalState } from './hooks/usePortalState';
import { GameRegistry } from './games/registry';
import { DemoDataBadge } from './components/DemoDataBadge';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { NotificationToast } from './components/NotificationToast';
import { Sparkles, Gamepad2 } from 'lucide-react';

// Modals
import { GameLauncherModal } from './components/GameLauncherModal';
import { EnergyModal } from './components/EnergyModal';
import { AuthModal } from './components/AuthModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { AdMobRewardedModal } from './components/AdMobRewardedModal';
import { AdMobInterstitialModal } from './components/AdMobInterstitialModal';
import { AdMobBanner } from './components/AdMobBanner';
import { TermsAndPrivacyModal } from './components/TermsAndPrivacyModal';
import { DailyRewardModal } from './components/DailyRewardModal';
import { MainMenuDrawer, MainMenuSection } from './components/MainMenuDrawer';

// Pages
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { GamesPage } from './pages/GamesPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { GamesContentPage } from './pages/content/GamesContentPage';
import { FAQPage } from './pages/content/FAQPage';
import { HelpSupportPage } from './pages/content/HelpSupportPage';
import { SubscriptionPage } from './pages/content/SubscriptionPage';
import { PricingPage } from './pages/content/PricingPage';
import { TermsPage } from './pages/content/TermsPage';
import { PrivacyPage } from './pages/content/PrivacyPage';

export default function App() {
  const {
    activeTab,
    setActiveTab,
    profile,
    setProfile,
    language,
    changeLanguage,
    t,
    // Game Launcher State
    activeGameToLaunch,
    launchGame,
    closeGameLauncher,
    handleGameFinished,
    lastGameSessionResult,
    // Modals
    isEnergyModalOpen,
    setIsEnergyModalOpen,
    isAuthModalOpen,
    setIsAuthModalOpen,
    isSubscriptionModalOpen,
    setIsSubscriptionModalOpen,
    isDailyRewardModalOpen,
    setIsDailyRewardModalOpen,
    rewardedAdState,
    triggerRewardedAd,
    setRewardedAdState,
    interstitialAdState,
    setInterstitialAdState,
    isLegalModalOpen,
    setIsLegalModalOpen,
    legalModalTab,
    openLegalModal,
    // Actions & Ledgers
    energyTransactions,
    claimableRewards,
    handleClaimReward,
    purchaseEnergyPackage,
    refillEnergyViaTelebirr,
    claimDailyStreak,
    handleSubscribe,
    resetDemoState,
    wipeAccountData,
    signOut,
    // Settings & Toasts
    audioEnabled,
    toggleAudio,
    hapticsEnabled,
    toggleHaptics,
    notifsEnabled,
    toggleNotifs,
    lowDataMode,
    toggleLowDataMode,
    toasts,
    showToast,
    dismissToast,
  } = usePortalState();

  const [isAppLaunching, setIsAppLaunching] = useState(true);
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false);
  const [contentView, setContentView] = useState<MainMenuSection | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAppLaunching(false);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  // Handle browser back button when a content page is open
  useEffect(() => {
    const handlePopState = () => {
      if (contentView !== null) {
        setContentView(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [contentView]);

  const navigateToContentSection = (section: MainMenuSection) => {
    window.history.pushState({ contentView: section }, '');
    setContentView(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackFromContent = () => {
    setContentView(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const allGames = GameRegistry.getAllGames();

  if (isAppLaunching) {
    return (
      <div className="fixed inset-0 z-50 bg-[#1688C9] text-white flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in">
        <div className="w-20 h-20 rounded-3xl bg-[#8BCB3D] flex items-center justify-center shadow-2xl mb-4 border-2 border-white/20">
          <span className="font-black text-2xl text-white tracking-tight">ET</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
          <span>TelePlus</span>
          <span className="text-xs px-2 py-0.5 rounded-md bg-[#8BCB3D] text-white uppercase font-black tracking-wider">
            ETHIO
          </span>
        </h1>
        <p className="text-xs text-blue-100 mt-1 font-medium">EthioTelecom Official Gaming Portal</p>
        <div className="mt-8 flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#8BCB3D] animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-[#8BCB3D] animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-[#8BCB3D] animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  if (!profile.isRegistered) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
        {contentView !== null ? (
          <main className="flex-1 w-full">
            {contentView === 'games' && (
              <div className="py-2">
                <GamesContentPage
                  games={allGames}
                  profile={profile}
                  onLaunchGame={(g) => launchGame(g)}
                  onBack={handleBackFromContent}
                  showHeader={true}
                />
              </div>
            )}

            {contentView === 'faq' && (
              <div className="py-2">
                <FAQPage
                  onBack={handleBackFromContent}
                  showHeader={true}
                />
              </div>
            )}

            {contentView === 'help_support' && (
              <div className="py-2">
                <HelpSupportPage
                  onBack={handleBackFromContent}
                  showHeader={true}
                />
              </div>
            )}

            {contentView === 'subscription' && (
              <div className="py-2">
                <SubscriptionPage
                  onBack={handleBackFromContent}
                  showHeader={true}
                  onSubscribeSms={(recipient, body) => {
                    window.location.href = `sms:${recipient}?body=${encodeURIComponent(body)}`;
                  }}
                />
              </div>
            )}

            {contentView === 'pricing' && (
              <div className="py-2">
                <PricingPage
                  onBack={handleBackFromContent}
                  showHeader={true}
                  onBuyCoins={() => setIsEnergyModalOpen(true)}
                  onSubscribeSms={(recipient, body) => {
                    window.location.href = `sms:${recipient}?body=${encodeURIComponent(body)}`;
                  }}
                />
              </div>
            )}

            {contentView === 'terms' && (
              <div className="py-2">
                <TermsPage
                  onBack={handleBackFromContent}
                  showHeader={true}
                />
              </div>
            )}

            {contentView === 'privacy' && (
              <div className="py-2">
                <PrivacyPage
                  onBack={handleBackFromContent}
                  showHeader={true}
                />
              </div>
            )}
          </main>
        ) : (
          <LoginPage
            onLoginSuccess={(upd) => setProfile(upd)}
            onOpenSubscribe={() => setIsSubscriptionModalOpen(true)}
            onOpenMenu={() => setIsMainMenuOpen(true)}
            showToast={showToast}
          />
        )}

        {/* Main Menu Drawer (7 Items in exact order) */}
        <MainMenuDrawer
          isOpen={isMainMenuOpen}
          onClose={() => setIsMainMenuOpen(false)}
          onSelectSection={(sec) => navigateToContentSection(sec)}
        />

        {/* Subscription Modal */}
        {isSubscriptionModalOpen && (
          <SubscriptionModal
            profile={profile}
            onClose={() => setIsSubscriptionModalOpen(false)}
            onSubscribe={(plan) => handleSubscribe(plan)}
          />
        )}

        {/* Energy / Buy Coins Modal */}
        {isEnergyModalOpen && (
          <EnergyModal
            profile={profile}
            onClose={() => setIsEnergyModalOpen(false)}
            onWatchAd={() => {
              setIsEnergyModalOpen(false);
              triggerRewardedAd('energy', 2, () => {});
            }}
            onPurchasePackage={purchaseEnergyPackage}
            onOpenVIP={() => {
              setIsEnergyModalOpen(false);
              setIsSubscriptionModalOpen(true);
            }}
            onOpenAuth={() => {
              setIsEnergyModalOpen(false);
              setIsAuthModalOpen(true);
            }}
          />
        )}

        {/* Legal / Settings Modal */}
        {isLegalModalOpen && (
          <TermsAndPrivacyModal
            initialTab={legalModalTab}
            onClose={() => setIsLegalModalOpen(false)}
            onConfirmDeleteAccount={wipeAccountData}
          />
        )}

        {/* Notification Toasts */}
        <NotificationToast toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] selection:bg-[#78BE20] selection:text-white">
      {/* 1. Global Header */}
      <Header
        profile={profile}
        onOpenBuyCoins={() => setIsEnergyModalOpen(true)}
        onOpenMenu={() => setIsMainMenuOpen(true)}
      />

      {/* 2. Main Dynamic Content Area (4 Navigation Tabs OR Full Content Page) */}
      <main className="flex-1 w-full">
        {/* Content Pages from Main Menu */}
        {contentView === 'games' && (
          <div className="py-2">
            <GamesContentPage
              games={allGames}
              profile={profile}
              onLaunchGame={(g) => launchGame(g)}
              onBack={handleBackFromContent}
              showHeader={true}
            />
          </div>
        )}

        {contentView === 'faq' && (
          <div className="py-2">
            <FAQPage
              onBack={handleBackFromContent}
              showHeader={true}
            />
          </div>
        )}

        {contentView === 'help_support' && (
          <div className="py-2">
            <HelpSupportPage
              onBack={handleBackFromContent}
              showHeader={true}
            />
          </div>
        )}

        {contentView === 'subscription' && (
          <div className="py-2">
            <SubscriptionPage
              onBack={handleBackFromContent}
              showHeader={true}
              onSubscribeSms={(recipient, body) => {
                window.location.href = `sms:${recipient}?body=${encodeURIComponent(body)}`;
              }}
            />
          </div>
        )}

        {contentView === 'pricing' && (
          <div className="py-2">
            <PricingPage
              onBack={handleBackFromContent}
              showHeader={true}
              onSubscribeSms={(recipient, body) => {
                window.location.href = `sms:${recipient}?body=${encodeURIComponent(body)}`;
              }}
            />
          </div>
        )}

        {contentView === 'terms' && (
          <div className="py-2">
            <TermsPage
              onBack={handleBackFromContent}
              showHeader={true}
            />
          </div>
        )}

        {contentView === 'privacy' && (
          <div className="py-2">
            <PrivacyPage
              onBack={handleBackFromContent}
              showHeader={true}
            />
          </div>
        )}

        {/* Tab Views (Active when no top-level content view is open) */}
        {contentView === null && (
          <>
            {activeTab === 'home' && (
              <HomePage
                games={allGames}
                profile={profile}
                onLaunchGame={(g) => launchGame(g)}
                onNavigateToGames={() => setActiveTab('games')}
              />
            )}

            {activeTab === 'games' && (
              <GamesPage
                games={allGames}
                profile={profile}
                onLaunchGame={(g) => launchGame(g)}
                categoryLabels={t.categories}
                onNavigateToLeaderboard={() => setActiveTab('leaderboard')}
              />
            )}

            {activeTab === 'leaderboard' && (
              <LeaderboardPage
                profile={profile}
                games={allGames}
                onPlayGame={(g) => launchGame(g)}
                periodLabels={t.leaderboardTabs}
              />
            )}

            {activeTab === 'profile' && (
              <ProfilePage
                profile={profile}
                games={allGames}
                energyTransactions={energyTransactions}
                claimableRewards={claimableRewards}
                language={language}
                onLanguageChange={changeLanguage}
                onOpenEnergyModal={() => setIsEnergyModalOpen(true)}
                onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
                onOpenLegalModal={openLegalModal}
                onPlayGame={(g) => launchGame(g)}
                onClaimReward={handleClaimReward}
                onSignOut={signOut}
                onResetDemo={resetDemoState}
                onWipeData={wipeAccountData}
                audioEnabled={audioEnabled}
                onToggleAudio={toggleAudio}
                hapticsEnabled={hapticsEnabled}
                onToggleHaptics={toggleHaptics}
                notifsEnabled={notifsEnabled}
                onToggleNotifs={toggleNotifs}
                lowDataMode={lowDataMode}
                onToggleLowDataMode={toggleLowDataMode}
                onSubscribePlan={(plan) => handleSubscribe(plan)}
                t={t}
              />
            )}
          </>
        )}
      </main>

      {/* 3. Main Menu Drawer (7 Items in exact order) */}
      <MainMenuDrawer
        isOpen={isMainMenuOpen}
        onClose={() => setIsMainMenuOpen(false)}
        onSelectSection={(sec) => navigateToContentSection(sec)}
      />

      {/* 4. Mobile-First Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        labels={{
          home: t.home,
          games: t.games,
          leaderboard: t.leaderboard,
          profile: t.profile,
        }}
      />

      {/* 5. Fullscreen Game Launcher / Session Bridge Modal */}
      {activeGameToLaunch && (
        <GameLauncherModal
          game={activeGameToLaunch}
          profile={profile}
          lastResult={lastGameSessionResult}
          onClose={closeGameLauncher}
          onGameOver={handleGameFinished}
          onPlayAgain={() => {
            const currentGame = activeGameToLaunch;
            closeGameLauncher();
            setTimeout(() => launchGame(currentGame), 100);
          }}
          onWatchAdForDouble={() => {
            triggerRewardedAd('coins', 150, () => {
              showToast('success', '+150 Bonus Coins & +2 Energy', 'Rewarded Ad Bonus Claimed!');
            });
          }}
          isAudioEnabled={audioEnabled}
        />
      )}

      {/* 6. Energy Refill Modal */}
      {isEnergyModalOpen && (
        <EnergyModal
          profile={profile}
          onClose={() => setIsEnergyModalOpen(false)}
          onWatchAd={() => {
            setIsEnergyModalOpen(false);
            triggerRewardedAd('energy', 2, () => {});
          }}
          onPurchasePackage={purchaseEnergyPackage}
          onOpenVIP={() => {
            setIsEnergyModalOpen(false);
            setIsSubscriptionModalOpen(true);
          }}
          onOpenAuth={() => {
            setIsEnergyModalOpen(false);
            setIsAuthModalOpen(true);
          }}
        />
      )}

      {/* 7. EthioTelecom SMS OTP Auth Modal */}
      {isAuthModalOpen && (
        <AuthModal
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={(upd) => setProfile(upd)}
          showToast={showToast}
        />
      )}

      {/* 8. VIP Subscription Pass Modal */}
      {isSubscriptionModalOpen && (
        <SubscriptionModal
          profile={profile}
          onClose={() => setIsSubscriptionModalOpen(false)}
          onSubscribe={(plan) => handleSubscribe(plan)}
        />
      )}

      {/* 9. Rewarded Ad Modal */}
      {rewardedAdState.isOpen && (
        <AdMobRewardedModal
          adState={rewardedAdState}
          onClose={() => setRewardedAdState((s) => ({ ...s, isOpen: false }))}
        />
      )}

      {/* 10. Interstitial Ad Modal */}
      {interstitialAdState.isOpen && (
        <AdMobInterstitialModal
          adState={interstitialAdState}
          onClose={() => setInterstitialAdState((s) => ({ ...s, isOpen: false }))}
        />
      )}

      {/* 11. Legal, Privacy & Account Wipe Modal */}
      {isLegalModalOpen && (
        <TermsAndPrivacyModal
          initialTab={legalModalTab}
          onClose={() => setIsLegalModalOpen(false)}
          onConfirmDeleteAccount={wipeAccountData}
        />
      )}

      {/* 12. 7-Day Daily Login Streak Modal */}
      {isDailyRewardModalOpen && (
        <DailyRewardModal
          profile={profile}
          onClose={() => setIsDailyRewardModalOpen(false)}
          onClaim={claimDailyStreak}
        />
      )}

      {/* 13. Floating Toast System */}
      <NotificationToast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
