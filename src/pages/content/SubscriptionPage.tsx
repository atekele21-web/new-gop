/**
 * Subscription Page Component for TelePlus
 * 
 * Verbatim content from Document Sections 9 & 10:
 * - 9. Subscription packages (Daily 5 ETB/day - Send 1 to 977, Weekly 15 ETB/week - Send 2 to 977, Monthly 35 ETB/month - Send 3 to 977)
 * - USSD Subscription info
 * - After Subscription access details
 * - Renewal terms
 * - 10. Unsubscription commands (STOP 1, STOP 2, STOP 3 to 977)
 */

import React, { useState } from 'react';
import { CreditCard, ArrowLeft, Send, CheckCircle2, AlertTriangle, ShieldCheck, Phone, Zap } from 'lucide-react';
import { TELEPLUS_SUBSCRIPTION_PACKAGES, TELEPLUS_SUBSCRIPTION_INFO } from '../../data/teleplusContent';

interface SubscriptionPageProps {
  onBack?: () => void;
  showHeader?: boolean;
  onSubscribeSms?: (recipient: string, body: string) => void;
}

export const SubscriptionPage: React.FC<SubscriptionPageProps> = ({
  onBack,
  showHeader = true,
  onSubscribeSms,
}) => {
  const [activeTab, setActiveTab] = useState<'subscribe' | 'unsubscribe'>('subscribe');

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
                id="subscription-back-btn"
                onClick={onBack}
                className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
                title="Go Back"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#8BCB3D] shrink-0" />
              <h1 className="text-base font-black tracking-tight">Subscription</h1>
            </div>
          </div>
        </div>
      )}

      {/* 2. Switcher between Subscribe and Unsubscribe */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 border border-slate-200 mb-4">
        <button
          onClick={() => setActiveTab('subscribe')}
          className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'subscribe'
              ? 'bg-[#8BCB3D] text-white shadow-xs'
              : 'bg-transparent text-[#17202A] hover:text-[#1688C9]'
          }`}
        >
          Subscribe Packages
        </button>
        <button
          onClick={() => setActiveTab('unsubscribe')}
          className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'unsubscribe'
              ? 'bg-[#1688C9] text-white shadow-xs'
              : 'bg-transparent text-[#17202A] hover:text-[#1688C9]'
          }`}
        >
          Unsubscription (STOP)
        </button>
      </div>

      {activeTab === 'subscribe' ? (
        <div className="space-y-4">
          {/* Subscription Packages */}
          <div className="space-y-3">
            {TELEPLUS_SUBSCRIPTION_PACKAGES.map((pkg) => (
              <div
                key={pkg.package}
                className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-[#1688C9] shadow-xs space-y-3 transition-all"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-[#17202A]">
                    {pkg.package} Package
                  </h3>
                  <div className="text-base font-black text-[#1688C9] font-mono">
                    {pkg.price}
                  </div>
                </div>

                <div className="text-xs text-slate-700 font-mono bg-slate-50 py-2 px-3 rounded-xl border border-slate-100">
                  {pkg.subscribeCmd}
                </div>

                <button
                  onClick={() => handleSmsTrigger(pkg.recipient, pkg.smsBody)}
                  className="w-full py-2.5 rounded-xl bg-[#8BCB3D] hover:bg-[#7cb736] active:scale-[0.99] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Subscribe</span>
                </button>
              </div>
            ))}
          </div>

          {/* USSD and Access Information */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5 text-xs text-slate-700 leading-relaxed">
            <h4 className="font-black text-[#17202A] uppercase text-[11px] tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#1688C9]" />
              USSD & Service Access
            </h4>
            <p>{TELEPLUS_SUBSCRIPTION_INFO.ussdInfo}</p>
            <div className="pt-2 border-t border-slate-200">
              <p className="whitespace-pre-line">{TELEPLUS_SUBSCRIPTION_INFO.afterSubscription}</p>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <h5 className="font-bold text-[#17202A] text-[11px]">Renewal:</h5>
              <p>{TELEPLUS_SUBSCRIPTION_INFO.renewal}</p>
            </div>
          </div>
        </div>
      ) : (
        /* Unsubscription View */
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed space-y-1">
            <h4 className="font-black flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              Unsubscription Information
            </h4>
            <p>{TELEPLUS_SUBSCRIPTION_INFO.unsubscription}</p>
          </div>

          <div className="space-y-3">
            {TELEPLUS_SUBSCRIPTION_PACKAGES.map((pkg) => (
              <div
                key={pkg.package}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-[#17202A]">
                    {pkg.package} Package
                  </h3>
                  <span className="text-xs font-mono font-bold text-slate-500">{pkg.price}</span>
                </div>

                <div className="text-xs text-slate-700 font-mono bg-slate-50 py-2 px-3 rounded-xl border border-slate-100">
                  {pkg.unsubBody} to 977
                </div>

                <button
                  onClick={() => handleSmsTrigger(pkg.recipient, pkg.unsubBody)}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 active:scale-[0.99] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send {pkg.unsubBody} to 977</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
