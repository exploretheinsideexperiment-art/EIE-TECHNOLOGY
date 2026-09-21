import React, { useState, useEffect } from 'react';
import { Settings, Shield, Key, Bell, Globe, Check, AlertCircle, Building2, QrCode, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import type { AppSettings, TokenValidityUnit, MerchantBankAccount } from '../types';
import { api } from '../utils/api';

interface SettingsViewProps {
  settings: AppSettings | null;
  onRefresh: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings: initialSettings, onRefresh }) => {
  const [platformName, setPlatformName] = useState(
    initialSettings?.platformName || initialSettings?.general?.appName || 'EIE-Technology'
  );
  const [tagline, setTagline] = useState(
    initialSettings?.tagline || initialSettings?.general?.subtitle || 'Explore the Inside Experiment-Technology (Created by Vipul)'
  );

  // Default Token Validity with Unit (Hour / Day / Month / Years)
  const [defaultTokenExpiryUnit, setDefaultTokenExpiryUnit] = useState<TokenValidityUnit>(
    initialSettings?.defaultTokenExpiryUnit || initialSettings?.tokens?.defaultExpiryUnit || 'hours'
  );
  const [defaultTokenExpiryValue, setDefaultTokenExpiryValue] = useState<string>(() => {
    if (initialSettings?.defaultTokenExpiryValue) return String(initialSettings.defaultTokenExpiryValue);
    if (initialSettings?.tokens?.defaultExpiryValue) return String(initialSettings.tokens.defaultExpiryValue);
    const h = initialSettings?.defaultTokenExpiryHours || initialSettings?.tokens?.defaultExpiryHours || 24;
    return String(h);
  });

  // Merchant Bank Account & Direct QR Settings
  const [accountNumber, setAccountNumber] = useState(
    initialSettings?.merchantAccount?.accountNumber || initialSettings?.bankAccount?.accountNumber || '987654321012'
  );
  const [accountHolderName, setAccountHolderName] = useState(
    initialSettings?.merchantAccount?.accountHolderName || initialSettings?.bankAccount?.accountHolderName || 'Explore The Inside Experiment'
  );
  const [bankName, setBankName] = useState(
    initialSettings?.merchantAccount?.bankName || initialSettings?.bankAccount?.bankName || 'State Bank of India'
  );
  const [ifscCode, setIfscCode] = useState(
    initialSettings?.merchantAccount?.ifscCode || initialSettings?.bankAccount?.ifscCode || 'SBIN0001234'
  );
  const [accountType, setAccountType] = useState<'Savings' | 'Current'>(
    initialSettings?.merchantAccount?.accountType || initialSettings?.bankAccount?.accountType || 'Current'
  );
  const [upiId, setUpiId] = useState(
    initialSettings?.merchantAccount?.upiId || initialSettings?.bankAccount?.upiId || 'exploretheinsideexperiment@okaxis'
  );
  const [directUpiEnabled, setDirectUpiEnabled] = useState(
    initialSettings?.merchantAccount?.directUpiEnabled ?? true
  );

  const [defaultMaxUses, setDefaultMaxUses] = useState(
    String(initialSettings?.defaultMaxUses || initialSettings?.tokens?.defaultMaxUses || 1)
  );
  const [rateLimitPerMinute, setRateLimitPerMinute] = useState(
    String(initialSettings?.rateLimitPerMinute || 60)
  );
  const [customDomain, setCustomDomain] = useState(
    initialSettings?.customDomain || initialSettings?.domain?.customDomain || 'pay.eie-technology.com'
  );
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (initialSettings) {
      setPlatformName(initialSettings.platformName || initialSettings.general?.appName || 'EIE-Technology');
      setTagline(initialSettings.tagline || initialSettings.general?.subtitle || 'Explore the Inside Experiment-Technology (Created by Vipul)');
      
      const unit = initialSettings.defaultTokenExpiryUnit || initialSettings.tokens?.defaultExpiryUnit || 'hours';
      setDefaultTokenExpiryUnit(unit);
      
      const val = initialSettings.defaultTokenExpiryValue || initialSettings.tokens?.defaultExpiryValue || initialSettings.defaultTokenExpiryHours || initialSettings.tokens?.defaultExpiryHours || 24;
      setDefaultTokenExpiryValue(String(val));

      // Bank account
      const bank = initialSettings.merchantAccount || initialSettings.bankAccount;
      if (bank) {
        setAccountNumber(bank.accountNumber || '');
        setAccountHolderName(bank.accountHolderName || '');
        setBankName(bank.bankName || '');
        setIfscCode(bank.ifscCode || '');
        setAccountType(bank.accountType || 'Current');
        setUpiId(bank.upiId || '');
        setDirectUpiEnabled(bank.directUpiEnabled ?? true);
      }

      setDefaultMaxUses(
        String(initialSettings.defaultMaxUses || initialSettings.tokens?.defaultMaxUses || 1)
      );
      setRateLimitPerMinute(String(initialSettings.rateLimitPerMinute || 60));
      setCustomDomain(
        initialSettings.customDomain || initialSettings.domain?.customDomain || 'pay.eie-technology.com'
      );
    }
  }, [initialSettings]);

  const calculateTotalHours = (unit: TokenValidityUnit, val: number): number => {
    if (unit === 'hours') return val;
    if (unit === 'days') return val * 24;
    if (unit === 'months') return val * 30 * 24;
    if (unit === 'years') return val * 365 * 24;
    return val;
  };

  const numExpiryValue = Math.max(1, Number(defaultTokenExpiryValue) || 1);
  const calculatedTotalHours = calculateTotalHours(defaultTokenExpiryUnit, numExpiryValue);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    const merchantAccountData: MerchantBankAccount = {
      accountNumber: accountNumber.trim(),
      accountHolderName: accountHolderName.trim(),
      bankName: bankName.trim(),
      ifscCode: ifscCode.trim().toUpperCase(),
      accountType,
      upiId: upiId.trim(),
      directUpiEnabled,
      qrNotePrefix: 'EIE',
    };

    try {
      await api.updateSettings({
        platformName,
        tagline,
        defaultTokenExpiryHours: calculatedTotalHours,
        defaultTokenExpiryUnit,
        defaultTokenExpiryValue: numExpiryValue,
        merchantAccount: merchantAccountData,
        bankAccount: merchantAccountData,
        defaultMaxUses: Number(defaultMaxUses) || 1,
        rateLimitPerMinute: Number(rateLimitPerMinute) || 60,
        customDomain,
        ...(initialSettings || {}),
        general: {
          ...(initialSettings?.general || { brandColor: '#10b981', supportEmail: 'support@eie-technology.com', publicUrl: 'https://pay.eie-technology.com' }),
          appName: platformName,
          subtitle: tagline,
        },
        tokens: {
          ...(initialSettings?.tokens || { ipBinding: false, deviceBinding: false, replayProtection: true }),
          defaultExpiryHours: calculatedTotalHours,
          defaultExpiryUnit: defaultTokenExpiryUnit,
          defaultExpiryValue: numExpiryValue,
          defaultMaxUses: Number(defaultMaxUses) || 1,
        },
        domain: {
          ...(initialSettings?.domain || { payDomain: 'pay.eie-technology.com' }),
          customDomain,
        },
      });
      await onRefresh();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const quickPresets: Array<{ label: string; unit: TokenValidityUnit; val: number }> = [
    { label: '1 Hour', unit: 'hours', val: 1 },
    { label: '24 Hours', unit: 'hours', val: 24 },
    { label: '7 Days', unit: 'days', val: 7 },
    { label: '30 Days (1 Month)', unit: 'months', val: 1 },
    { label: '3 Months', unit: 'months', val: 3 },
    { label: '6 Months', unit: 'months', val: 6 },
    { label: '1 Year', unit: 'years', val: 1 },
    { label: '3 Years', unit: 'years', val: 3 },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Platform Configuration & Gateways
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            SYSTEM ENGINE
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Settlement bank account for QR payments, token validity policy, and gateway credentials
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* BANK ACCOUNT & DIRECT UPI SETTLEMENT (MERA ACCOUNT NO ADD KARNE KA OPTION) */}
        <div className="p-6 rounded-2xl bg-[#0c1422] border border-emerald-500/30 shadow-2xl space-y-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#162338]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  Merchant Bank Account & Direct Settlement
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-sans font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    DIRECT PAYOUT
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  QR Code se scan karke aaya hua paisa sidha aapke is bank account aur UPI me aayega
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer bg-[#070b14] px-3 py-1.5 rounded-xl border border-[#1b2b42]">
              <input
                type="checkbox"
                checked={directUpiEnabled}
                onChange={(e) => setDirectUpiEnabled(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
              <span className="text-xs font-semibold text-emerald-300">Direct QR Settlement Active</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Bank Account Number (बैंक खाता संख्या) <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder=""
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b14] border border-[#1b2b42] text-sm font-mono text-emerald-300 font-bold focus:outline-none focus:border-emerald-400"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Paisa sidha is account number me receive hoga.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Account Holder Name (खाताधारक का नाम) <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                placeholder=""
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b14] border border-[#1b2b42] text-sm text-white focus:outline-none focus:border-emerald-400"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                As per bank passbook / cancelled cheque.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Bank Name (बैंक का नाम)
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder=""
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b14] border border-[#1b2b42] text-sm text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                IFSC Code (IFSC कोड)
              </label>
              <input
                type="text"
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value)}
                placeholder=""
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b14] border border-[#1b2b42] text-sm font-mono uppercase text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Account Type (खाता प्रकार)
              </label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b14] border border-[#1b2b42] text-sm text-white focus:outline-none focus:border-emerald-400"
              >
                <option value="Current">Current Account (चालू खाता)</option>
                <option value="Savings">Savings Account (बचत खाता)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Merchant UPI ID / VPA (Direct QR Transfer) <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder=""
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b14] border border-[#1b2b42] text-sm font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-400"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Google Pay / PhonePe / Paytm / BHIM QR is UPI ID se link hoga.
              </span>
            </div>
          </div>

          {/* Live QR Settlement Info Box */}
          <div className="p-4 rounded-xl bg-[#080d16] border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <QrCode className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  Direct NPCI UPI Bank Route Configured
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Settlement A/C: {accountNumber ? `••••${accountNumber.slice(-4)}` : 'Not Set'} ({bankName || 'Bank'}) | VPA: <span className="text-emerald-300">{upiId}</span>
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              ZERO GATEWAY COMMISSION (0%)
            </span>
          </div>
        </div>

        {/* DEFAULT TOKEN VALIDITY POLICY: HOUR / DAY / MONTH / YEARS & VALUE CHANGE OPTION */}
        <div className="p-6 rounded-2xl bg-[#0c1422] border border-[#18263a] shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#162338]">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Default One-Time Token Validity (Hour / Month / Years)
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Total: <strong className="text-emerald-400">{calculatedTotalHours.toLocaleString()} Hours</strong>
            </span>
          </div>

          {/* Unit Selector & Value Input (Niche value change karne ka option) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Default Validity Unit (समय इकाई चुनें)
              </label>
              <div className="grid grid-cols-4 gap-1.5 bg-[#060a12] p-1.5 rounded-xl border border-[#1b2b42]">
                {(['hours', 'days', 'months', 'years'] as const).map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => setDefaultTokenExpiryUnit(unit)}
                    className={`py-2 text-xs font-bold rounded-lg capitalize transition ${
                      defaultTokenExpiryUnit === unit
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {unit === 'hours' ? 'Hour' : unit === 'days' ? 'Day' : unit === 'months' ? 'Month' : 'Year'}
                  </button>
                ))}
              </div>
            </div>

            {/* Value input (Niche value change karne ka option) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Default Duration Value (कितने {defaultTokenExpiryUnit === 'hours' ? 'घंटे (Hours)' : defaultTokenExpiryUnit === 'days' ? 'दिन (Days)' : defaultTokenExpiryUnit === 'months' ? 'महीने (Months)' : 'साल (Years)'})
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max={defaultTokenExpiryUnit === 'hours' ? 8760 : defaultTokenExpiryUnit === 'days' ? 3650 : defaultTokenExpiryUnit === 'months' ? 120 : 10}
                  value={defaultTokenExpiryValue}
                  onChange={(e) => setDefaultTokenExpiryValue(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b14] border border-[#1b2b42] text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-400"
                />
                <span className="px-3.5 py-2.5 rounded-xl bg-[#0d1726] border border-[#1b2b42] text-xs font-bold text-emerald-400 capitalize">
                  {defaultTokenExpiryUnit}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <span className="block text-[11px] text-slate-400 mb-1.5 font-mono">
              Quick Presets (त्वरित चयन):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickPresets.map((preset) => {
                const isSelected = defaultTokenExpiryUnit === preset.unit && Number(defaultTokenExpiryValue) === preset.val;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setDefaultTokenExpiryUnit(preset.unit);
                      setDefaultTokenExpiryValue(String(preset.val));
                    }}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                        : 'bg-[#060a12] border-[#1b2b42] text-slate-400 hover:text-white hover:border-slate-500'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Duration Summary */}
          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Default link duration: <strong className="text-white font-bold">{defaultTokenExpiryValue} {defaultTokenExpiryUnit}</strong> ({calculatedTotalHours.toLocaleString()} Total Hours).
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Enforced server-side
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Default Max Uses (1 = Single-Use / Ek Baar Ke Liye)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={defaultMaxUses}
                onChange={(e) => setDefaultMaxUses(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#070b14] border border-[#1b2b42] text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Rate Limit Threshold (Req/Min/IP)
              </label>
              <input
                type="number"
                min="10"
                max="1000"
                value={rateLimitPerMinute}
                onChange={(e) => setRateLimitPerMinute(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#070b14] border border-[#1b2b42] text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>
        </div>

        {/* Gateway Credentials */}
        <div className="p-6 rounded-2xl bg-[#0c1422] border border-[#18263a] shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#162338]">
            <Key className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Payment Gateway Credentials (Server Encrypted)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Razorpay Key ID
              </label>
              <input
                type="text"
                defaultValue="rzp_live_9k3F8201aLw9"
                readOnly
                className="w-full px-3.5 py-2 rounded-xl bg-[#070b14] border border-[#1b2b42] text-xs font-mono text-slate-300 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Razorpay Webhook Secret (HMAC-SHA256)
              </label>
              <input
                type="password"
                defaultValue="whsec_eie_secret_9921_production"
                readOnly
                className="w-full px-3.5 py-2 rounded-xl bg-[#070b14] border border-[#1b2b42] text-xs font-mono text-emerald-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Cashfree App ID
              </label>
              <input
                type="text"
                defaultValue="CF_APP_892842019"
                readOnly
                className="w-full px-3.5 py-2 rounded-xl bg-[#070b14] border border-[#1b2b42] text-xs font-mono text-slate-300 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Cashfree Secret Key
              </label>
              <input
                type="password"
                defaultValue="cf_sec_live_99283182"
                readOnly
                className="w-full px-3.5 py-2 rounded-xl bg-[#070b14] border border-[#1b2b42] text-xs font-mono text-emerald-400 focus:outline-none"
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            🔒 In production, secrets are sealed in server environment variables and never sent in unauthenticated API responses.
          </p>
        </div>

        {/* Branding & Custom Domain */}
        <div className="p-6 rounded-2xl bg-[#0c1422] border border-[#18263a] shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#162338]">
            <Globe className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Branding & Custom Domain
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Platform Name
              </label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#070b14] border border-[#1b2b42] text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Brand Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#070b14] border border-[#1b2b42] text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Production Custom Domain
              </label>
              <input
                type="text"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="pay.yourbrand.com"
                className="w-full px-3.5 py-2 rounded-xl bg-[#070b14] border border-[#1b2b42] text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-400"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Point a CNAME DNS record to this server for branded checkout pages.
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
              <Check className="w-4 h-4" />
              <span>Settings updated successfully! Bank account & token validity saved.</span>
            </div>
          )}
          {!savedSuccess && <div />}

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition active:scale-95 disabled:opacity-50"
          >
            {saving ? 'Updating Configuration...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
};
