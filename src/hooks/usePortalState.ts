/**
 * Central State Hook for TelePlay Ethiopia
 * Orchestrates user profile, energy timers, modal visibility, game launching,
 * subscriptions, rewards, Google AdMob lifecycle, and multi-language dictionary.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  NavigationTab, 
  UserProfile, 
  LanguageCode, 
  GameDefinition, 
  Tournament, 
  ToastMessage, 
  RewardedAdState,
  InterstitialAdState,
  GameSessionResult,
  SubscriptionPlan,
  EnergyTransaction,
  ClaimableReward
} from '../types';
import { StorageService } from '../services/storageService';
import { TRANSLATIONS } from '../utils/translations';
import { GameBridgeService } from '../services/gameBridge';
import { SubscriptionService } from '../services/subscriptionService';
import { AuthService } from '../services/authService';
import { AdMobService } from '../services/adMobService';
import { PaymentService } from '../services/paymentService';
import { RewardService } from '../services/rewardService';
import { DAILY_REWARD_LADDER } from '../services/demoData';

export function usePortalState() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('home');
  const [profile, setProfile] = useState<UserProfile>(() => StorageService.getProfile());
  const [language, setLanguage] = useState<LanguageCode>(() => StorageService.getLanguage());
  
  // Modals state
  const [activeGameToLaunch, setActiveGameToLaunch] = useState<GameDefinition | null>(null);
  const [activeTournamentId, setActiveTournamentId] = useState<string | undefined>(undefined);
  const [isEnergyModalOpen, setIsEnergyModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isDailyRewardModalOpen, setIsDailyRewardModalOpen] = useState(false);
  const [lastGameSessionResult, setLastGameSessionResult] = useState<GameSessionResult | null>(null);

  // Legal & Privacy modal
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'terms' | 'privacy' | 'datasafety' | 'delete_account'>('terms');

  // Rewarded Ad state
  const [rewardedAdState, setRewardedAdState] = useState<RewardedAdState>({
    isOpen: false,
    adId: '',
    brand: '',
    durationSeconds: 5,
    rewardType: 'energy',
    rewardAmount: 2,
    onRewardClaimed: () => {},
  });

  // Interstitial Ad state
  const [interstitialAdState, setInterstitialAdState] = useState<InterstitialAdState>({
    isOpen: false,
    adId: '',
    brand: '',
    durationSeconds: 3,
    onAdClosed: () => {},
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Settings
  const [audioEnabled, setAudioEnabled] = useState<boolean>(() => StorageService.getAudioEnabled());
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(() => StorageService.getHapticsEnabled());
  const [notifsEnabled, setNotifsEnabled] = useState<boolean>(() => StorageService.getNotificationsEnabled());
  const [lowDataMode, setLowDataMode] = useState<boolean>(() => StorageService.getLowDataMode());

  // Energy & Rewards state
  const [energyTransactions, setEnergyTransactions] = useState<EnergyTransaction[]>(() =>
    StorageService.getEnergyTransactions()
  );
  const [claimableRewards, setClaimableRewards] = useState<ClaimableReward[]>(() =>
    RewardService.getClaimableRewards()
  );

  // Language dictionary helper
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const showToast = useCallback((type: ToastMessage['type'], title: string, description?: string) => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Energy auto-refill interval
  useEffect(() => {
    const interval = setInterval(() => {
      setProfile((curr) => {
        const updated = StorageService.recalculateEnergy(curr);
        return updated;
      });
    }, 15000); // check every 15 seconds

    return () => clearInterval(interval);
  }, []);

  // Change Language
  const changeLanguage = useCallback((newLang: LanguageCode) => {
    setLanguage(newLang);
    StorageService.saveLanguage(newLang);
  }, []);

  // Toggle Preferences
  const toggleAudio = useCallback(() => {
    setAudioEnabled((prev) => {
      const next = !prev;
      StorageService.saveAudioEnabled(next);
      return next;
    });
  }, []);

  const toggleHaptics = useCallback(() => {
    setHapticsEnabled((prev) => {
      const next = !prev;
      StorageService.saveHapticsEnabled(next);
      return next;
    });
  }, []);

  const toggleNotifs = useCallback(() => {
    setNotifsEnabled((prev) => {
      const next = !prev;
      StorageService.saveNotificationsEnabled(next);
      return next;
    });
  }, []);

  const toggleLowDataMode = useCallback(() => {
    setLowDataMode((prev) => {
      const next = !prev;
      StorageService.saveLowDataMode(next);
      return next;
    });
  }, []);

  // Open Legal Modals
  const openLegalModal = useCallback((tab: 'terms' | 'privacy' | 'datasafety' | 'delete_account' = 'terms') => {
    setLegalModalTab(tab);
    setIsLegalModalOpen(true);
  }, []);

  // Launch Game Handler
  const launchGame = useCallback((game: GameDefinition, tournamentId?: string) => {
    const check = GameBridgeService.canLaunchGame(game, profile);
    if (!check.allowed) {
      if (check.requiresAuth) {
        setIsAuthModalOpen(true);
      } else if (check.requiresCoins) {
        setIsEnergyModalOpen(true);
      } else if (check.requiresSubscription) {
        setIsSubscriptionModalOpen(true);
      }
      showToast('warning', 'Action Needed', check.reason);
      return;
    }

    const { updatedProfile } = GameBridgeService.deductCoinsForLaunch(game, profile);
    setProfile(updatedProfile);

    // Record consumption into transaction ledger
    const tx: EnergyTransaction = {
      transactionId: 'CTX_PLAY_' + Date.now().toString(36).toUpperCase(),
      type: 'GAME_CONSUMPTION',
      amount: -(game.entryCostCoins || 10),
      timestamp: new Date().toISOString(),
      status: 'COMPLETED',
      details: `Match Entry: ${game.title}`,
    };
    StorageService.recordEnergyTransaction(tx);
    setEnergyTransactions(StorageService.getEnergyTransactions());

    setActiveGameToLaunch(game);
    setActiveTournamentId(tournamentId);
    setLastGameSessionResult(null);
  }, [profile, showToast]);

  // Submit Game Results
  const handleGameFinished = useCallback((finalScore: number, durationSeconds: number) => {
    if (!activeGameToLaunch) return;

    const { result, updatedProfile, transaction } = GameBridgeService.submitScore(
      activeGameToLaunch.id,
      finalScore,
      durationSeconds,
      profile,
      activeTournamentId
    );

    setProfile(updatedProfile);
    setLastGameSessionResult(result);

    if (transaction) {
      showToast(
        'success',
        '🏆 Tournament Score Confirmed!',
        `Rank #${transaction.rank} verified! Prize: ${transaction.reward}`
      );
    } else if (result.isNewHighScore) {
      showToast('success', 'New High Score!', `You set a new personal record of ${result.score.toLocaleString()} in ${activeGameToLaunch.title}!`);
    } else {
      showToast('info', 'Match Completed', `Earned +${result.coinsEarned} Coins and +${result.xpEarned} XP!`);
    }
  }, [activeGameToLaunch, activeTournamentId, profile, showToast]);

  // Close Game Runner
  const closeGameLauncher = useCallback(() => {
    setActiveGameToLaunch(null);
    setActiveTournamentId(undefined);
    setLastGameSessionResult(null);
  }, []);

  // Trigger Rewarded Ad
  const triggerRewardedAd = useCallback((
    rewardType: 'energy' | 'coins' = 'energy',
    rewardAmount: number = 2,
    onSuccess: () => void = () => {}
  ) => {
    const offer = AdMobService.getRandomRewardedOffer(rewardType);
    setRewardedAdState({
      isOpen: true,
      adId: offer.id,
      brand: offer.brand,
      durationSeconds: 5,
      rewardType,
      rewardAmount,
      onRewardClaimed: () => {
        onSuccess();
        setRewardedAdState((s) => ({ ...s, isOpen: false }));
        if (rewardType === 'energy') {
          setProfile((curr) => {
            const nextEnergy = Math.min(curr.maxEnergy, curr.energy + rewardAmount);
            const upd = { ...curr, energy: nextEnergy };
            StorageService.saveProfile(upd);
            return upd;
          });
          const tx: EnergyTransaction = {
            transactionId: 'ETX_AD_' + Date.now().toString(36).toUpperCase(),
            type: 'REWARDED_AD_BONUS',
            amount: rewardAmount,
            timestamp: new Date().toISOString(),
            status: 'COMPLETED',
            details: 'Rewarded Ad Sponsor Bonus',
          };
          StorageService.recordEnergyTransaction(tx);
          setEnergyTransactions(StorageService.getEnergyTransactions());
          showToast('energy', `+${rewardAmount} Energy Restored`, 'EthioTelecom sponsored boost granted!');
        } else if (rewardType === 'coins') {
          setProfile((curr) => {
            const upd = { ...curr, coins: curr.coins + rewardAmount };
            StorageService.saveProfile(upd);
            return upd;
          });
          showToast('success', `+${rewardAmount} Coins Claimed!`, 'Reward successfully deposited.');
        }
      },
    });
  }, [showToast]);

  // Purchase Energy Package via PaymentService
  const purchaseEnergyPackage = useCallback(async (
    energyAmount: number, 
    costETB: number
  ): Promise<{ success: boolean; message: string }> => {
    if (!profile.isRegistered || !profile.telebirrLinked) {
      setIsAuthModalOpen(true);
      return { success: false, message: 'Please sign in with your EthioTelecom phone number to pay via TeleBirr.' };
    }

    const payResult = await PaymentService.processPayment(profile, {
      method: 'TELEBIRR',
      amountETB: costETB,
      itemType: 'ENERGY_PACK',
      itemTitle: `${energyAmount} Energy Points Pack`,
    });

    if (payResult.status === 'SUCCESS') {
      const updated: UserProfile = {
        ...profile,
        telebirrBalance: Number((profile.telebirrBalance - costETB).toFixed(2)),
        energy: profile.energy + energyAmount,
        maxEnergy: Math.max(profile.maxEnergy, profile.energy + energyAmount),
        lastEnergyRefillTimestamp: Date.now(),
      };

      setProfile(updated);
      StorageService.saveProfile(updated);

      // Record Energy Transaction
      const energyTx: EnergyTransaction = {
        transactionId: payResult.transaction.transactionId,
        type: 'PURCHASE_TELEBIRR',
        amount: energyAmount,
        timestamp: new Date().toISOString(),
        status: 'COMPLETED',
        details: `TeleBirr Purchase (${costETB} ETB)`,
      };
      StorageService.recordEnergyTransaction(energyTx);
      setEnergyTransactions(StorageService.getEnergyTransactions());

      showToast('success', `+${energyAmount} Energy Added!`, `Charged ${costETB} ETB via TeleBirr.`);
      return { success: true, message: `Successfully purchased ${energyAmount} Energy for ${costETB} ETB.` };
    } else {
      showToast('error', 'Payment Failed', payResult.message);
      return { success: false, message: payResult.message };
    }
  }, [profile, showToast]);

  // TeleBirr Instant Energy Refill
  const refillEnergyViaTelebirr = useCallback(() => {
    purchaseEnergyPackage(10, 3.0);
    setIsEnergyModalOpen(false);
  }, [purchaseEnergyPackage]);

  // Daily Streak Claim
  const claimDailyStreak = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (profile.streak.hasClaimedToday && profile.streak.lastClaimedDate === today) {
      showToast('info', 'Already Claimed', 'Come back tomorrow for the next streak bonus!');
      return;
    }

    const streakIndex = (profile.streak.current - 1) % DAILY_REWARD_LADDER.length;
    const reward = DAILY_REWARD_LADDER[streakIndex];

    const newCoins = profile.coins + reward.coins;
    const newEnergy = Math.min(profile.maxEnergy, profile.energy + reward.energy);
    const nextStreak = profile.streak.current + 1;

    const updated: UserProfile = {
      ...profile,
      coins: newCoins,
      energy: newEnergy,
      streak: {
        current: nextStreak,
        lastClaimedDate: today,
        hasClaimedToday: true,
      },
    };

    setProfile(updated);
    StorageService.saveProfile(updated);

    if (reward.energy > 0) {
      const tx: EnergyTransaction = {
        transactionId: 'ETX_STREAK_' + Date.now().toString(36).toUpperCase(),
        type: 'DAILY_REWARD',
        amount: reward.energy,
        timestamp: new Date().toISOString(),
        status: 'COMPLETED',
        details: `Day ${reward.day} Streak Bonus`,
      };
      StorageService.recordEnergyTransaction(tx);
      setEnergyTransactions(StorageService.getEnergyTransactions());
    }

    showToast('success', `Day ${reward.day} Streak Claimed!`, `+${reward.coins} Coins & +${reward.energy} Energy added.`);
  }, [profile, showToast]);

  // Claim Reward Prize
  const handleClaimReward = useCallback(async (rewardId: string) => {
    const res = await RewardService.claimReward(rewardId, profile);
    if (res.success && res.updatedProfile) {
      setProfile(res.updatedProfile);
      setClaimableRewards(RewardService.getClaimableRewards());
      showToast('success', '🏆 TeleBirr Prize Disbursed!', res.message);
    } else {
      showToast('error', 'Claim Failed', res.message);
    }
  }, [profile, showToast]);

  // Subscribe to VIP Pass
  const handleSubscribe = useCallback(async (plan: SubscriptionPlan) => {
    const res = await SubscriptionService.subscribe(plan);
    if (res.success && res.profile) {
      setProfile(res.profile);
      setIsSubscriptionModalOpen(false);
      showToast('success', 'VIP Activated', res.message);
    } else {
      showToast('error', 'Subscription Failed', res.message);
    }
  }, [showToast]);

  // Reset Demo State
  const resetDemoState = useCallback(() => {
    const reset = StorageService.resetDemoState();
    setProfile(reset);
    setEnergyTransactions(StorageService.getEnergyTransactions());
    setClaimableRewards(RewardService.getClaimableRewards());
    showToast('info', 'Demo Data Reset', 'Restored initial sample EthioTelecom user and high scores.');
  }, [showToast]);

  // Wipe Account Data Completely
  const wipeAccountData = useCallback(() => {
    const freshGuest = StorageService.wipeAllData();
    setProfile(freshGuest);
    setEnergyTransactions([]);
    setClaimableRewards([]);
    showToast('info', 'Account Erased', 'All local credentials, ledgers and match histories wiped.');
  }, [showToast]);

  // Sign out / Sign in
  const signOut = useCallback(() => {
    const guest = AuthService.signOut();
    setProfile(guest);
    showToast('info', 'Signed Out', 'You are now playing in Guest mode.');
  }, [showToast]);

  return {
    activeTab,
    setActiveTab,
    profile,
    setProfile,
    language,
    changeLanguage,
    t,
    // Modals
    activeGameToLaunch,
    launchGame,
    closeGameLauncher,
    handleGameFinished,
    lastGameSessionResult,
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
  };
}
