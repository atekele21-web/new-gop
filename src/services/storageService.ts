/**
 * Storage Service for TelePlay Ethiopia
 * Handles client-side offline persistence for profile, scores, energy, and preferences.
 */

import { UserProfile, LanguageCode } from '../types';
import { DEMO_USER_PROFILE } from './demoData';

const STORAGE_KEYS = {
  PROFILE: 'teleplay_ethio_profile_v1',
  LANGUAGE: 'teleplay_ethio_language_v1',
  AUDIO_ENABLED: 'teleplay_ethio_audio_v1',
  HAPTICS_ENABLED: 'teleplay_ethio_haptics_v1',
  NOTIFS_ENABLED: 'teleplay_ethio_notifs_v1',
  LOW_DATA_MODE: 'teleplay_ethio_low_data_v1',
  ENERGY_TXS: 'teleplay_ethio_energy_txs_v1',
  COIN_TXS: 'teleplay_ethio_coin_txs_v1',
  PAYMENT_TXS: 'teleplay_ethio_payment_txs_v1',
};

import { EnergyTransaction, PaymentTransaction } from '../types';

export interface CoinTransaction {
  id: string;
  type: 'INITIAL_SUBSCRIPTION' | 'GAME_ENTRY' | 'TOURNAMENT_WIN' | 'TELEBIRR_PURCHASE';
  amount: number;
  description: string;
  timestamp: string;
}

const INITIAL_COIN_TXS: CoinTransaction[] = [
  {
    id: 'CTX_WELCOME_01',
    type: 'INITIAL_SUBSCRIPTION',
    amount: 25,
    description: 'Initial EthioTelecom Subscription Allocation',
    timestamp: new Date().toISOString(),
  },
];

const INITIAL_ENERGY_TXS: EnergyTransaction[] = [
  {
    transactionId: 'ETX_INIT_01',
    type: 'DAILY_REGEN',
    amount: 10,
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'COMPLETED',
    details: 'Initial Daily Energy Pool Refill',
  },
];

const ENERGY_REFILL_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes per 1 energy point

export const StorageService = {
  getProfile(): UserProfile {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (!stored) {
        // Initialize with default demo profile
        this.saveProfile(DEMO_USER_PROFILE);
        return DEMO_USER_PROFILE;
      }
      const parsed: UserProfile = JSON.parse(stored);
      // Auto-calculate energy recharge based on elapsed time
      return this.recalculateEnergy(parsed);
    } catch {
      return DEMO_USER_PROFILE;
    }
  },

  saveProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.warn('[StorageService] Failed to save profile to localStorage:', e);
    }
  },

  /**
   * One-time grant of 25 coins upon confirmed subscription
   */
  grantInitialSubscriptionCoins(profile: UserProfile): UserProfile {
    if (profile.hasReceivedInitialCoins) {
      return profile;
    }

    const updated: UserProfile = {
      ...profile,
      coins: profile.coins + 25,
      hasReceivedInitialCoins: true,
    };

    this.saveProfile(updated);

    this.recordCoinTransaction({
      id: 'CTX_SUB_' + Date.now().toString(36).toUpperCase(),
      type: 'INITIAL_SUBSCRIPTION',
      amount: 25,
      description: 'Confirmed Subscription Allocation (25 Coins)',
      timestamp: new Date().toISOString(),
    });

    return updated;
  },

  clearSession(): UserProfile {
    const unauthenticated: UserProfile = {
      id: 'usr_guest_' + Math.random().toString(36).substring(2, 7),
      phoneNumber: '',
      displayName: 'EthioTelecom Gamer',
      avatarId: 'avatar_runner',
      isRegistered: false,
      telebirrLinked: false,
      telebirrBalance: 0,
      coins: 0,
      xp: 0,
      level: 1,
      energy: 5,
      maxEnergy: 5,
      lastEnergyRefillTimestamp: Date.now(),
      hasReceivedInitialCoins: false,
      subscription: {
        plan: 'free',
        isActive: false,
        autoRenew: false,
      },
      streak: {
        current: 1,
        lastClaimedDate: '',
        hasClaimedToday: false,
      },
      highScores: {},
      achievements: [],
      matchesPlayed: 0,
      trophiesCount: 0,
    };

    this.saveProfile(unauthenticated);
    return unauthenticated;
  },

  recalculateEnergy(profile: UserProfile): UserProfile {
    // If VIP subscriber, always maintain max or unlimited
    if (profile.subscription?.isActive) {
      return {
        ...profile,
        energy: profile.maxEnergy,
      };
    }

    if (profile.energy >= profile.maxEnergy) {
      return {
        ...profile,
        lastEnergyRefillTimestamp: Date.now(),
      };
    }

    const now = Date.now();
    const elapsed = now - (profile.lastEnergyRefillTimestamp || now);
    const refillPoints = Math.floor(elapsed / ENERGY_REFILL_INTERVAL_MS);

    if (refillPoints > 0) {
      const newEnergy = Math.min(profile.maxEnergy, profile.energy + refillPoints);
      const updated: UserProfile = {
        ...profile,
        energy: newEnergy,
        lastEnergyRefillTimestamp: newEnergy >= profile.maxEnergy ? now : profile.lastEnergyRefillTimestamp + (refillPoints * ENERGY_REFILL_INTERVAL_MS),
      };
      this.saveProfile(updated);
      return updated;
    }

    return profile;
  },

  getCoinTransactions(): CoinTransaction[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COIN_TXS);
      if (!stored) {
        this.saveCoinTransactions(INITIAL_COIN_TXS);
        return INITIAL_COIN_TXS;
      }
      return JSON.parse(stored);
    } catch {
      return INITIAL_COIN_TXS;
    }
  },

  saveCoinTransactions(txs: CoinTransaction[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.COIN_TXS, JSON.stringify(txs));
    } catch (e) {
      console.warn('[StorageService] Failed to save coin transactions:', e);
    }
  },

  recordCoinTransaction(tx: CoinTransaction): void {
    const list = this.getCoinTransactions();
    list.unshift(tx);
    this.saveCoinTransactions(list.slice(0, 50));
  },

  resetDemoState(): UserProfile {
    try {
      localStorage.removeItem(STORAGE_KEYS.PROFILE);
      this.saveProfile(DEMO_USER_PROFILE);
      return DEMO_USER_PROFILE;
    } catch {
      return DEMO_USER_PROFILE;
    }
  },

  getLanguage(): LanguageCode {
    try {
      const lang = localStorage.getItem(STORAGE_KEYS.LANGUAGE) as LanguageCode;
      return (lang === 'en' || lang === 'am' || lang === 'om') ? lang : 'en';
    } catch {
      return 'en';
    }
  },

  saveLanguage(lang: LanguageCode): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
    } catch (e) {
      console.warn('[StorageService] Failed to save language:', e);
    }
  },

  getAudioEnabled(): boolean {
    return localStorage.getItem(STORAGE_KEYS.AUDIO_ENABLED) !== 'false';
  },

  saveAudioEnabled(enabled: boolean): void {
    localStorage.setItem(STORAGE_KEYS.AUDIO_ENABLED, enabled ? 'true' : 'false');
  },

  getHapticsEnabled(): boolean {
    return localStorage.getItem(STORAGE_KEYS.HAPTICS_ENABLED) !== 'false';
  },

  saveHapticsEnabled(enabled: boolean): void {
    localStorage.setItem(STORAGE_KEYS.HAPTICS_ENABLED, enabled ? 'true' : 'false');
  },

  getNotificationsEnabled(): boolean {
    return localStorage.getItem(STORAGE_KEYS.NOTIFS_ENABLED) !== 'false';
  },

  saveNotificationsEnabled(enabled: boolean): void {
    localStorage.setItem(STORAGE_KEYS.NOTIFS_ENABLED, enabled ? 'true' : 'false');
  },

  getLowDataMode(): boolean {
    return localStorage.getItem(STORAGE_KEYS.LOW_DATA_MODE) === 'true';
  },

  saveLowDataMode(enabled: boolean): void {
    localStorage.setItem(STORAGE_KEYS.LOW_DATA_MODE, enabled ? 'true' : 'false');
  },

  getEnergyTransactions(): EnergyTransaction[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ENERGY_TXS);
      if (!stored) {
        this.saveEnergyTransactions(INITIAL_ENERGY_TXS);
        return INITIAL_ENERGY_TXS;
      }
      return JSON.parse(stored);
    } catch {
      return INITIAL_ENERGY_TXS;
    }
  },

  saveEnergyTransactions(txs: EnergyTransaction[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ENERGY_TXS, JSON.stringify(txs));
    } catch (e) {
      console.warn('[StorageService] Failed to save energy transactions:', e);
    }
  },

  recordEnergyTransaction(tx: EnergyTransaction): void {
    const list = this.getEnergyTransactions();
    list.unshift(tx);
    // Keep last 50 transactions for performance
    this.saveEnergyTransactions(list.slice(0, 50));
  },

  getPaymentTransactions(): PaymentTransaction[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PAYMENT_TXS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  savePaymentTransactions(txs: PaymentTransaction[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PAYMENT_TXS, JSON.stringify(txs));
    } catch (e) {
      console.warn('[StorageService] Failed to save payment transactions:', e);
    }
  },

  recordPaymentTransaction(tx: PaymentTransaction): void {
    const list = this.getPaymentTransactions();
    const existingIndex = list.findIndex((t) => t.transactionId === tx.transactionId);
    if (existingIndex >= 0) {
      list[existingIndex] = tx;
    } else {
      list.unshift(tx);
    }
    this.savePaymentTransactions(list.slice(0, 50));
  },

  wipeAllData(): UserProfile {
    try {
      localStorage.clear();
      this.saveProfile(DEMO_USER_PROFILE);
      return DEMO_USER_PROFILE;
    } catch {
      return DEMO_USER_PROFILE;
    }
  },
};

