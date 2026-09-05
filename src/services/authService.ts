/**
 * EthioTelecom Authentication Service
 * Supports Mobile Station International Subscriber Directory Number (MSISDN) login,
 * SMS OTP verification, and TeleBirr Direct Connect.
 */

import { UserProfile } from '../types';
import { StorageService } from './storageService';

export interface AuthResponse {
  success: boolean;
  message: string;
  profile?: UserProfile;
}

export const AuthService = {
  /**
   * Request 6-digit OTP code via EthioTelecom SMS gateway
   */
  async requestOtp(phoneNumber: string): Promise<{ success: boolean; message: string; demoOtp: string }> {
    // Validate Ethiopian phone format
    const cleaned = phoneNumber.replace(/\D/g, '');
    const isEthio = cleaned.startsWith('2519') || cleaned.startsWith('2517') || cleaned.startsWith('09') || cleaned.startsWith('07') || cleaned.length === 9 || cleaned.length === 10 || cleaned.length === 12;
    
    if (!isEthio) {
      return {
        success: false,
        message: 'Please enter a valid EthioTelecom phone number starting with 09 or 07.',
        demoOtp: '',
      };
    }

    // Generate fixed 6-digit demo OTP for immediate testing
    const demoOtp = '123456';
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: `SMS Verification code sent to ${phoneNumber}. [Demo OTP: 123456]`,
          demoOtp,
        });
      }, 500);
    });
  },

  /**
   * Verify 6-digit OTP and log in
   */
  async verifyOtp(phoneNumber: string, otp: string): Promise<AuthResponse> {
    const trimmedOtp = otp.trim();
    if (trimmedOtp !== '123456' && trimmedOtp.length !== 6) {
      return {
        success: false,
        message: 'Invalid 6-digit verification code. Please use demo code 123456.',
      };
    }

    const current = StorageService.getProfile();
    // Clean and normalize phone number (e.g. 0912345678)
    let normalizedPhone = phoneNumber.replace(/\D/g, '');
    if (normalizedPhone.startsWith('251')) {
      normalizedPhone = '0' + normalizedPhone.slice(3);
    }
    if (!normalizedPhone.startsWith('0') && (normalizedPhone.startsWith('9') || normalizedPhone.startsWith('7'))) {
      normalizedPhone = '0' + normalizedPhone;
    }
    if (!normalizedPhone) normalizedPhone = '0912345678';

    const updated: UserProfile = {
      ...current,
      phoneNumber: normalizedPhone,
      isRegistered: true,
      telebirrLinked: true,
    };

    StorageService.saveProfile(updated);

    return {
      success: true,
      message: 'Successfully authenticated with EthioTelecom.',
      profile: updated,
    };
  },

  /**
   * Fast TeleBirr One-Click Authenticator
   */
  async loginWithTeleBirr(): Promise<AuthResponse> {
    const current = StorageService.getProfile();
    const updated: UserProfile = {
      ...current,
      phoneNumber: '0911428890',
      displayName: 'EthioTelecom Gamer',
      isRegistered: true,
      telebirrLinked: true,
      telebirrBalance: Math.max(current.telebirrBalance, 250),
    };

    StorageService.saveProfile(updated);

    return {
      success: true,
      message: 'Connected with TeleBirr SuperApp successfully.',
      profile: updated,
    };
  },

  /**
   * Sign out and clear authenticated session
   */
  signOut(): UserProfile {
    return StorageService.clearSession();
  }
};
