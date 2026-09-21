import React, { useState, useEffect } from 'react';
import { X, Lock, Shield, Link, AlertTriangle, Clock, Building2, CheckCircle2 } from 'lucide-react';
import type { Resource, TokenValidityUnit } from '../types';

interface ResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (resource: Partial<Resource>) => Promise<void>;
  initialResource?: Resource | null;
}

export const ResourceModal: React.FC<ResourceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialResource,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [originalUrl, setOriginalUrl] = useState('');
  const [category, setCategory] = useState('Cybersecurity');
  const [price, setPrice] = useState('199');
  const [currency, setCurrency] = useState('INR');
  
  // Token validity duration controls (hour / month / years & custom value below)
  const [tokenValidityUnit, setTokenValidityUnit] = useState<TokenValidityUnit>('hours');
  const [tokenValidityValue, setTokenValidityValue] = useState('24');
  
  // Bank Account & Direct QR payout options
  const [useCustomBank, setUseCustomBank] = useState(false);
  const [customAccountNumber, setCustomAccountNumber] = useState('');
  const [customAccountName, setCustomAccountName] = useState('');
  const [customIfscCode, setCustomIfscCode] = useState('');
  const [customBankName, setCustomBankName] = useState('');
  const [customUpiId, setCustomUpiId] = useState('');

  const [maxUses, setMaxUses] = useState('1');
  const [isEnabled, setIsEnabled] = useState(true);
  const [qrEnabled, setQrEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [paymentGateway, setPaymentGateway] = useState<'Razorpay' | 'Cashfree' | 'Stripe' | 'UPI Standard'>('Razorpay');
  const [customSlug, setCustomSlug] = useState('');
  const [successRedirect, setSuccessRedirect] = useState('');
  const [failureRedirect, setFailureRedirect] = useState('');
  const [autoCacheBust, setAutoCacheBust] = useState(true);
  const [githubRepoUrl, setGithubRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialResource) {
      setName(initialResource.name);
      setDescription(initialResource.description);
      setOriginalUrl(initialResource.originalUrl);
      setCategory(initialResource.category);
      setPrice(String(initialResource.price));
      setCurrency(initialResource.currency);
      setAutoCacheBust(initialResource.autoCacheBust !== false);
      setGithubRepoUrl(initialResource.githubRepoUrl || '');

      // Determine unit and value
      if (initialResource.tokenValidityUnit && initialResource.tokenValidityValue) {
        setTokenValidityUnit(initialResource.tokenValidityUnit);
        setTokenValidityValue(String(initialResource.tokenValidityValue));
      } else {
        const hours = initialResource.tokenValidityHours || 24;
        if (hours >= 365 * 24 && hours % (365 * 24) === 0) {
          setTokenValidityUnit('years');
          setTokenValidityValue(String(hours / (365 * 24)));
        } else if (hours >= 30 * 24 && hours % (30 * 24) === 0) {
          setTokenValidityUnit('months');
          setTokenValidityValue(String(hours / (30 * 24)));
        } else if (hours >= 24 && hours % 24 === 0) {
          setTokenValidityUnit('days');
          setTokenValidityValue(String(hours / 24));
        } else {
          setTokenValidityUnit('hours');
          setTokenValidityValue(String(hours));
        }
      }

      // Bank account
      if (initialResource.customAccountNumber || initialResource.customUpiId) {
        setUseCustomBank(true);
        setCustomAccountNumber(initialResource.customAccountNumber || '');
        setCustomAccountName(initialResource.customAccountName || '');
        setCustomIfscCode(initialResource.customIfscCode || '');
        setCustomBankName(initialResource.customBankName || '');
        setCustomUpiId(initialResource.customUpiId || '');
      } else {
        setUseCustomBank(false);
        setCustomAccountNumber('');
        setCustomAccountName('');
        setCustomIfscCode('');
        setCustomBankName('');
        setCustomUpiId('');
      }

      setMaxUses(String(initialResource.maxUses || 1));
      setIsEnabled(initialResource.isEnabled);
      setQrEnabled(initialResource.qrEnabled);
      setEmailEnabled(initialResource.emailEnabled);
      setSmsEnabled(initialResource.smsEnabled);
      setWhatsappEnabled(initialResource.whatsappEnabled);
      setPaymentGateway(initialResource.paymentGateway);
      setCustomSlug(initialResource.customSlug || '');
      setSuccessRedirect(initialResource.successRedirect || '');
      setFailureRedirect(initialResource.failureRedirect || '');
    } else {
      setName('');
      setDescription('');
      setOriginalUrl('https://github.com/my-org/private-repo');
      setCategory('Cybersecurity');
      setPrice('199');
      setCurrency('INR');
      setTokenValidityUnit('hours');
      setTokenValidityValue('24');
      setUseCustomBank(false);
      setCustomAccountNumber('');
      setCustomAccountName('');
      setCustomIfscCode('');
      setCustomBankName('');
      setCustomUpiId('');
      setMaxUses('1');
      setIsEnabled(true);
      setQrEnabled(true);
      setEmailEnabled(true);
      setSmsEnabled(false);
      setWhatsappEnabled(false);
      setPaymentGateway('Razorpay');
      setCustomSlug('');
      setSuccessRedirect('');
      setFailureRedirect('');
    }
    setError(null);
  }, [initialResource, isOpen]);

  if (!isOpen) return null;

  const calculateTotalHours = (unit: TokenValidityUnit, val: number): number => {
    if (unit === 'hours') return val;
    if (unit === 'days') return val * 24;
    if (unit === 'months') return val * 30 * 24;
    if (unit === 'years') return val * 365 * 24;
    return val;
  };

  const currentNumericValue = Math.max(1, Number(tokenValidityValue) || 1);
  const totalCalculatedHours = calculateTotalHours(tokenValidityUnit, currentNumericValue);

  const githubMatch = originalUrl.match(/github\.com\/([^\/\s]+)\/([^\/\?\s#]+)/i);
  const isGithubRepo = Boolean(githubMatch) && !originalUrl.includes('github.io');
  const suggestedPagesUrl = githubMatch
    ? `https://${githubMatch[1].toLowerCase()}.github.io/${githubMatch[2].replace(/\.git$/i, '')}/`
    : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide a resource name');
      return;
    }
    if (!originalUrl.trim().startsWith('http://') && !originalUrl.trim().startsWith('https://')) {
      setError('Original Destination URL must start with https:// or http:// for security protection.');
      return;
    }

    try {
      setLoading(true);
      await onSave({
        id: initialResource?.id,
        name: name.trim(),
        description: description.trim(),
        originalUrl: originalUrl.trim(),
        category,
        price: Number(price) || 0,
        currency,
        tokenValidityUnit,
        tokenValidityValue: currentNumericValue,
        tokenValidityHours: totalCalculatedHours,
        customAccountNumber: useCustomBank ? customAccountNumber.trim() : undefined,
        customAccountName: useCustomBank ? customAccountName.trim() : undefined,
        customIfscCode: useCustomBank ? customIfscCode.trim().toUpperCase() : undefined,
        customBankName: useCustomBank ? customBankName.trim() : undefined,
        customUpiId: useCustomBank ? customUpiId.trim() : undefined,
        maxUses: Number(maxUses) || 1,
        isEnabled,
        qrEnabled,
        emailEnabled,
        smsEnabled,
        whatsappEnabled,
        paymentGateway,
        customSlug: customSlug.trim() || undefined,
        successRedirect: successRedirect.trim() || undefined,
        failureRedirect: failureRedirect.trim() || undefined,
        autoCacheBust,
        githubRepoUrl: githubRepoUrl.trim() || (githubMatch ? `https://github.com/${githubMatch[1]}/${githubMatch[2]}` : undefined),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save resource');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#0c1422] border border-[#1e2f47] rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Pinned Sticky Header - Always 100% visible at top */}
        <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#18263a] bg-[#090d16] z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight">
                {initialResource ? 'Edit Protected Resource' : 'Add New Protected Resource'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure payment gate, one-time token policy, and cloaked destination
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Scrollable Container */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-5 overscroll-contain">
            {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Security Notice */}
          <div className="p-3.5 rounded-xl bg-[#080d16] border border-emerald-500/20 flex items-start gap-3 text-xs text-slate-300">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-emerald-300">Protected Cloak Enforcement:</span>
              <p className="text-slate-400 mt-0.5">
                The Original Destination URL is stored encrypted on the server and is NEVER exposed in the payment QR, confirmation receipt, or frontend API responses.
              </p>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Resource Name <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Zero-Trust Infrastructure Blueprint"
                className="w-full px-3.5 py-2 rounded-xl bg-[#070b14] border border-[#1b2b42] text-sm text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#070b14] border border-[#1b2b42] text-sm text-white focus:outline-none focus:border-emerald-400"
              >
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Developer Tools">Developer Tools</option>
                <option value="Courses & Guides">Courses & Guides</option>
                <option value="Compliance">Compliance & SOC2</option>
                <option value="Digital Software">Digital Software</option>
                <option value="Private Repositories">Private Repositories</option>
              </select>
            </div>
          </div>

          {/* Original Destination URL (The private secret URL) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5 text-emerald-400" />
                Original Destination URL (Private Link) <span className="text-emerald-400">*</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">CLOAKED SERVER-SIDE</span>
            </label>
            <input
              type="url"
              required
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              placeholder="https://github.com/USERNAME/PRIVATE-RESOURCE"
              className="w-full px-3.5 py-2 font-mono rounded-xl bg-[#070b14] border border-[#1b2b42] text-sm text-emerald-400 focus:outline-none focus:border-emerald-400"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Customers will receive a protected one-time URL like <code className="text-slate-300">https://pay.eie-technology.com/access/X7k92...</code> rather than this link.
            </p>

            {/* GitHub Repo Intelligence & Pages Converter */}
            {isGithubRepo && (
              <div className="mt-2.5 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-base">💡</span>
                  <div>
                    <strong className="text-white">GitHub Web Page Notice:</strong>
                    <p className="text-[11px] text-indigo-300 mt-0.5">
                      Agar aapne is GitHub repo me web page ya HTML/React code banaya hai, toh 'GitHub Pages' link use karein taaki user ko live web app dikhe (bina GitHub raw files ke).
                    </p>
                  </div>
                </div>
                {suggestedPagesUrl && (
                  <button
                    type="button"
                    onClick={() => setOriginalUrl(suggestedPagesUrl)}
                    className="w-full py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow"
                  >
                    <span>🌐 Convert to Live GitHub Pages URL:</span>
                    <code className="bg-indigo-900/80 px-1.5 py-0.5 rounded text-[11px]">{suggestedPagesUrl}</code>
                  </button>
                )}
              </div>
            )}

            {/* Auto Cache Busting Toggle */}
            <div className="mt-2.5 flex items-center justify-between p-2.5 rounded-lg bg-[#070b14] border border-[#1b2b42]">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">⚡ Auto Cache-Bust & Instant Sync</span>
                <span className="text-[10px] text-slate-400 block">Git commit push karte hi naya code turant bina stale cache ke live load hoga</span>
              </div>
              <input
                type="checkbox"
                checked={autoCacheBust}
                onChange={(e) => setAutoCacheBust(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 focus:ring-offset-0 bg-[#0c1424] border-[#223552]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description shown on the customer checkout page..."
              className="w-full px-3.5 py-2 rounded-xl bg-[#070b14] border border-[#1b2b42] text-sm text-white focus:outline-none focus:border-emerald-400"
            />
          </div>

          {/* Pricing & Gateway */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Payment Amount <span className="text-emerald-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#070b14] border border-[#1b2b42] text-sm text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#070b14] border border-[#1b2b42] text-sm text-white focus:outline-none focus:border-emerald-400"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Payment Gateway</label>
              <select
                value={paymentGateway}
                onChange={(e) => setPaymentGateway(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#070b14] border border-[#1b2b42] text-sm text-white focus:outline-none focus:border-emerald-400"
              >
                <option value="Razorpay">Razorpay (Cards, UPI, Netbanking)</option>
                <option value="Cashfree">Cashfree Payments</option>
                <option value="UPI Standard">Direct UPI QR (सीधा बैंक खाता)</option>
                <option value="Stripe">Stripe Global</option>
              </select>
            </div>
          </div>

          {/* TOKEN VALIDITY SETTINGS: HOUR / MONTH / YEARS & VALUE CHANGE OPTION */}
          <div className="p-4 rounded-xl bg-[#090e18] border border-[#17253b] space-y-4">
            <div className="flex items-center justify-between border-b border-[#142033] pb-2.5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
                  Token Validity Duration (Hour / Day / Month / Years)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Total: <strong className="text-emerald-400 font-bold">{totalCalculatedHours.toLocaleString()} Hours</strong>
              </span>
            </div>

            {/* Unit Selector & Value Input (Option to change value right underneath) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Validity Unit (समय इकाई चुनें)
                </label>
                <div className="grid grid-cols-4 gap-1.5 bg-[#060a12] p-1 rounded-xl border border-[#1b2b42]">
                  <button
                    type="button"
                    onClick={() => setTokenValidityUnit('hours')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                      tokenValidityUnit === 'hours'
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Hour
                  </button>
                  <button
                    type="button"
                    onClick={() => setTokenValidityUnit('days')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                      tokenValidityUnit === 'days'
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Day
                  </button>
                  <button
                    type="button"
                    onClick={() => setTokenValidityUnit('months')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                      tokenValidityUnit === 'months'
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Month
                  </button>
                  <button
                    type="button"
                    onClick={() => setTokenValidityUnit('years')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                      tokenValidityUnit === 'years'
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Year
                  </button>
                </div>
              </div>

              {/* Value Input (Niche value change karne ka option) */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Validity Value (कितने {tokenValidityUnit === 'hours' ? 'घंटे (Hours)' : tokenValidityUnit === 'days' ? 'दिन (Days)' : tokenValidityUnit === 'months' ? 'महीने (Months)' : 'साल (Years)'})
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max={tokenValidityUnit === 'hours' ? 8760 : tokenValidityUnit === 'days' ? 3650 : tokenValidityUnit === 'months' ? 120 : 10}
                    value={tokenValidityValue}
                    onChange={(e) => setTokenValidityValue(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#060a12] border border-[#1b2b42] text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-400"
                    placeholder="Enter value..."
                  />
                  <span className="px-3 py-2 rounded-xl bg-[#0d1726] border border-[#1b2b42] text-xs font-bold text-emerald-400 capitalize">
                    {tokenValidityUnit}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Presets Pills */}
            <div>
              <span className="block text-[11px] text-slate-400 mb-1.5 font-mono">
                Quick Presets (त्वरित चयन):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: '1 Hour', unit: 'hours' as const, val: 1 },
                  { label: '24 Hours', unit: 'hours' as const, val: 24 },
                  { label: '7 Days', unit: 'days' as const, val: 7 },
                  { label: '30 Days (1 Month)', unit: 'months' as const, val: 1 },
                  { label: '3 Months', unit: 'months' as const, val: 3 },
                  { label: '6 Months', unit: 'months' as const, val: 6 },
                  { label: '1 Year', unit: 'years' as const, val: 1 },
                  { label: '3 Years', unit: 'years' as const, val: 3 },
                ].map((preset) => {
                  const isSelected = tokenValidityUnit === preset.unit && Number(tokenValidityValue) === preset.val;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setTokenValidityUnit(preset.unit);
                        setTokenValidityValue(String(preset.val));
                      }}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition ${
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

            {/* Expiry summary card */}
            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Active Duration: <strong className="text-white font-bold">{tokenValidityValue} {tokenValidityUnit}</strong> ({totalCalculatedHours.toLocaleString()} Hours total).
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Auto-expires after payment
              </span>
            </div>

            {/* Maximum Uses */}
            <div className="pt-1">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Maximum Token Uses (1 = Single-Use / Ek Baar Ke Liye)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                className="w-full sm:w-48 px-3 py-1.5 rounded-lg bg-[#060a12] border border-[#1b2b42] text-sm text-white focus:outline-none focus:border-emerald-400"
              />
              <span className="text-[10px] text-slate-400 block mt-1">Set to 1 for strictly single-use protected access.</span>
            </div>
          </div>

          {/* BANK ACCOUNT & DIRECT QR SETTLEMENT (MERA ACCOUNT NO ADD KARNE KA OPTION) */}
          <div className="p-4 rounded-xl bg-[#090e18] border border-[#17253b] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
                  Bank Account & Direct QR Settlement (सीधा बैंक खाता)
                </h3>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCustomBank}
                  onChange={(e) => setUseCustomBank(e.target.checked)}
                  className="w-3.5 h-3.5 accent-emerald-500 rounded"
                />
                <span className="text-xs text-slate-300 font-medium">Custom Account For This Link</span>
              </label>
            </div>

            <p className="text-[11px] text-slate-400">
              {useCustomBank
                ? 'Is resource ke QR Code se scan karke kiya gaya payment sidha is bank account me aayega.'
                : 'Default platform settings ka bank account aur UPI ID use hoga. Custom account ke liye upar check karein.'}
            </p>

            {useCustomBank && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#162438]">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Bank Account Number (बैंक खाता संख्या)
                  </label>
                  <input
                    type="text"
                    value={customAccountNumber}
                    onChange={(e) => setCustomAccountNumber(e.target.value)}
                    placeholder=""
                    className="w-full px-3 py-1.5 rounded-lg bg-[#060a12] border border-[#1b2b42] text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Account Holder Name (खाताधारक का नाम)
                  </label>
                  <input
                    type="text"
                    value={customAccountName}
                    onChange={(e) => setCustomAccountName(e.target.value)}
                    placeholder=""
                    className="w-full px-3 py-1.5 rounded-lg bg-[#060a12] border border-[#1b2b42] text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Bank Name (बैंक का नाम)
                  </label>
                  <input
                    type="text"
                    value={customBankName}
                    onChange={(e) => setCustomBankName(e.target.value)}
                    placeholder=""
                    className="w-full px-3 py-1.5 rounded-lg bg-[#060a12] border border-[#1b2b42] text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    IFSC Code (IFSC कोड)
                  </label>
                  <input
                    type="text"
                    value={customIfscCode}
                    onChange={(e) => setCustomIfscCode(e.target.value)}
                    placeholder=""
                    className="w-full px-3 py-1.5 rounded-lg bg-[#060a12] border border-[#1b2b42] text-xs font-mono uppercase text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    UPI ID / VPA for Direct QR (Google Pay / PhonePe / Paytm)
                  </label>
                  <input
                    type="text"
                    value={customUpiId}
                    onChange={(e) => setCustomUpiId(e.target.value)}
                    placeholder=""
                    className="w-full px-3 py-1.5 rounded-lg bg-[#060a12] border border-[#1b2b42] text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-400"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    QR code scan karne par customer ka PhonePe / GPay / Paytm sidha is ID par payment send karega.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Channels & Feature Flags */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#080d16] border border-[#162338] cursor-pointer hover:border-slate-600">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
              <span className="text-xs text-slate-200 font-medium">Resource Active</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#080d16] border border-[#162338] cursor-pointer hover:border-slate-600">
              <input
                type="checkbox"
                checked={qrEnabled}
                onChange={(e) => setQrEnabled(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
              <span className="text-xs text-slate-200 font-medium">Enable QR</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#080d16] border border-[#162338] cursor-pointer hover:border-slate-600">
              <input
                type="checkbox"
                checked={emailEnabled}
                onChange={(e) => setEmailEnabled(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
              <span className="text-xs text-slate-200 font-medium">Email Alert</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#080d16] border border-[#162338] cursor-pointer hover:border-slate-600">
              <input
                type="checkbox"
                checked={whatsappEnabled}
                onChange={(e) => setWhatsappEnabled(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
              <span className="text-xs text-slate-200 font-medium">WhatsApp</span>
            </label>
          </div>
        </div>

        {/* Sticky Pinned Footer Actions */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-5 sm:px-6 py-3.5 border-t border-[#18263a] bg-[#090d16] z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition active:scale-95 disabled:opacity-50 inline-flex items-center gap-2"
          >
            {loading ? 'Saving Resource...' : (initialResource ? 'UPDATE RESOURCE' : 'SAVE RESOURCE')}
          </button>
        </div>
      </form>
    </div>
  </div>
);
};
