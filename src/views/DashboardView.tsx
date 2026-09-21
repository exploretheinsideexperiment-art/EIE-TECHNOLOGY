import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  RefreshCw,
  PlusCircle,
  Check,
  Copy,
  Smartphone,
  Send,
  X,
  Laptop,
  ArrowRight,
} from 'lucide-react';
import type { DashboardStats, PaymentSession, AccessTokenRecord, SecurityEvent, Resource } from '../types';
import { api } from '../utils/api';

interface DashboardViewProps {
  stats: DashboardStats | null;
  sessions: PaymentSession[];
  tokens: AccessTokenRecord[];
  securityEvents: SecurityEvent[];
  resources: Resource[];
  onOpenResource: (resource: Resource) => void;
  onNavigateTab: (tab: any) => void;
  onRefresh?: () => Promise<void> | void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  sessions,
  tokens,
  securityEvents,
  resources,
  onOpenResource,
  onNavigateTab,
  onRefresh,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [showQuickVerifyModal, setShowQuickVerifyModal] = useState(false);

  // Quick payment recording state
  const defaultResource = resources[0];
  const [quickResourceId, setQuickResourceId] = useState(defaultResource?.id || '');
  const [quickAmount, setQuickAmount] = useState<number>(defaultResource?.price || 199);
  const [quickCustomerName, setQuickCustomerName] = useState('Scanner UPI Customer');
  const [quickCustomerEmail, setQuickCustomerEmail] = useState('exploretheinsideexperiment@gmail.com');
  const [quickCustomerPhone, setQuickCustomerPhone] = useState('');
  const [quickUtr, setQuickUtr] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);
  const [quickResult, setQuickResult] = useState<any | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  const handleOpenQuickVerify = () => {
    const res = resources.find((r) => r.id === quickResourceId) || resources[0];
    if (res) {
      setQuickResourceId(res.id);
      setQuickAmount(res.price || 199);
    }
    setQuickError(null);
    setQuickResult(null);
    setShowQuickVerifyModal(true);
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickLoading(true);
    setQuickError(null);

    try {
      const result = await api.recordDirectPayment({
        resourceId: quickResourceId,
        amount: quickAmount,
        currency: 'INR',
        utrNumber: quickUtr.trim() || undefined,
        customerName: quickCustomerName.trim() || 'Scanner UPI Customer',
        customerEmail: quickCustomerEmail.trim() || 'exploretheinsideexperiment@gmail.com',
        customerPhone: quickCustomerPhone.trim() || '',
        paymentMethod: 'UPI',
      });

      setQuickResult(result);
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err: any) {
      setQuickError(err.message || 'Payment recording failed');
    } finally {
      setQuickLoading(false);
    }
  };

  const selectedRes = resources.find((r) => r.id === quickResourceId) || resources[0];

  const cards = [
    {
      title: 'Total Revenue',
      value: stats ? `₹${(stats.totalRevenue || 0).toLocaleString()}` : '₹0',
      subtitle: stats && stats.todayTransactions > 0 ? `${stats.todayTransactions} today's transactions` : '0 today transactions',
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      targetTab: 'transactions',
      actionLabel: 'View Transactions',
    },
    {
      title: 'Successful Payments',
      value: stats?.successfulPayments || 0,
      subtitle: stats && stats.totalPayments > 0 ? `${stats.conversionRate}% verification rate` : '0% (No transactions yet)',
      icon: CheckCircle2,
      color: 'text-teal-400',
      bg: 'bg-teal-500/10 border-teal-500/30',
      targetTab: 'transactions',
      actionLabel: 'View Verified',
    },
    {
      title: 'Pending Sessions',
      value: stats?.pendingPayments || 0,
      subtitle: stats && stats.pendingPayments > 0 ? 'Awaiting webhook capture' : '0 pending sessions',
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/30',
      targetTab: 'transactions',
      actionLabel: 'View Pending',
    },
    {
      title: 'Failed / Rejected',
      value: stats?.failedPayments || 0,
      subtitle: stats && stats.failedPayments > 0 ? 'Declined or tampered' : '0 rejected',
      icon: XCircle,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/30',
      targetTab: 'transactions',
      actionLabel: 'View Failed',
    },
    {
      title: 'Active One-Time Tokens',
      value: stats?.activeTokens || 0,
      subtitle: stats && stats.activeTokens > 0 ? 'Single-use valid tokens' : '0 active tokens',
      icon: KeyRound,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/30',
      targetTab: 'tokens',
      actionLabel: 'View Tokens',
    },
    {
      title: 'Consumed / Used Tokens',
      value: stats?.usedTokens || 0,
      subtitle: stats && stats.usedTokens > 0 ? 'Single-use consumed & locked' : '0 consumed',
      icon: ShieldCheck,
      color: 'text-emerald-300',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      targetTab: 'tokens',
      actionLabel: 'View Consumed',
    },
    {
      title: 'Expired / Revoked',
      value: (stats?.expiredTokens || 0) + (stats?.revokedTokens || 0),
      subtitle: `${stats?.expiredTokens || 0} expired, ${stats?.revokedTokens || 0} revoked`,
      icon: AlertTriangle,
      color: 'text-slate-400',
      bg: 'bg-slate-500/10 border-slate-500/30',
      targetTab: 'tokens',
      actionLabel: 'View Expired',
    },
    {
      title: 'Total Transactions',
      value: stats?.totalPayments || 0,
      subtitle: stats && stats.totalPayments > 0 ? 'Lifetime processed orders' : '0 processed orders',
      icon: CreditCard,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/30',
      targetTab: 'transactions',
      actionLabel: 'View All Logs',
    },
  ];

  // Revenue chart calculation
  const revenuePoints = stats?.revenueByDay || [];
  const maxRevenue = Math.max(...revenuePoints.map((p) => p.amount), 0);
  const total7DayRevenue = revenuePoints.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Platform Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d1624] via-[#0e1c2e] to-[#0d1624] border border-[#1e2f47] p-6 lg:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>PROTECTED LINK DISPATCH & PAYMENT GATEWAY</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-[11px] font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Sync Active</span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              EIE-Technology Defense Dashboard
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Serving protected one-time access links upon verified server-side payment gateway webhooks. Original private repositories and digital asset URLs remain strictly server-cloaked.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Record / Verify Payment Button */}
            <button
              onClick={handleOpenQuickVerify}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs sm:text-sm hover:from-emerald-400 hover:to-teal-400 transition shadow-lg shadow-emerald-500/25 flex items-center gap-1.5 active:scale-95"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>Verify / Record Payment</span>
            </button>

            {/* Test Customer Payment Flow Button */}
            <button
              onClick={() => onNavigateTab('pay_customer')}
              className="px-3.5 py-2.5 rounded-xl bg-[#142236] border border-[#213857] text-white font-semibold text-xs sm:text-sm hover:bg-[#1a2e49] transition flex items-center gap-1.5"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Test Pay Page</span>
            </button>

            {/* Live Refresh Sync Button */}
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="p-2.5 rounded-xl bg-[#101a2b] border border-[#1b2f4a] text-slate-300 hover:text-white hover:bg-[#16253c] transition active:scale-95 disabled:opacity-50"
              title="Force Sync Server Stats"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Decorative Grid Lines */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Metric Cards Grid - All 8 Cards Are Fully Interactive */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onNavigateTab(card.targetTab)}
              className="p-4 sm:p-5 rounded-2xl bg-[#0c1422] border border-[#18263a] hover:border-emerald-500/50 hover:bg-[#0f1b2d] transition-all text-left group shadow-md active:scale-[0.98] relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-400 group-hover:text-slate-200 transition">
                  {card.title}
                </span>
                <div className={`p-2 rounded-xl border ${card.bg} group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                {card.value}
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-[11px] text-slate-400 font-mono truncate">{card.subtitle}</p>
                <span className="text-[10px] text-emerald-400 font-mono font-bold opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5 shrink-0 ml-1">
                  {card.actionLabel} <ArrowRight className="w-2.5 h-2.5" />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Verify / Add UPI Payment Modal */}
      {showQuickVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0b1320] border border-[#1f3350] p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#18263a] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Record & Verify Direct UPI Payment</h3>
                  <p className="text-xs text-slate-400">Add payment from scanner or direct UPI transfer</p>
                </div>
              </div>
              <button
                onClick={() => setShowQuickVerifyModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {quickError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{quickError}</span>
              </div>
            )}

            {!quickResult ? (
              <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
                {/* Resource Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Select Digital Resource / Product
                  </label>
                  <select
                    value={quickResourceId}
                    onChange={(e) => {
                      setQuickResourceId(e.target.value);
                      const res = resources.find((r) => r.id === e.target.value);
                      if (res) setQuickAmount(res.price);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b14] border border-[#1b2b42] text-xs font-semibold text-white focus:outline-none focus:border-emerald-400"
                  >
                    {resources.map((res) => (
                      <option key={res.id} value={res.id}>
                        {res.name} — {res.currency} {res.price}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Amount (₹ INR)
                    </label>
                    <input
                      type="number"
                      required
                      value={quickAmount}
                      onChange={(e) => setQuickAmount(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b14] border border-[#1b2b42] text-sm font-mono text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      UPI Reference / UTR Number
                    </label>
                    <input
                      type="text"
                      value={quickUtr}
                      onChange={(e) => setQuickUtr(e.target.value)}
                      placeholder="e.g. 423987123456 (Optional)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b14] border border-[#1b2b42] text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                {/* Customer Details */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      value={quickCustomerName}
                      onChange={(e) => setQuickCustomerName(e.target.value)}
                      placeholder="Customer name"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b14] border border-[#1b2b42] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Customer Email
                      </label>
                      <input
                        type="email"
                        value={quickCustomerEmail}
                        onChange={(e) => setQuickCustomerEmail(e.target.value)}
                        placeholder="customer@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b14] border border-[#1b2b42] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        WhatsApp / Phone No.
                      </label>
                      <input
                        type="tel"
                        value={quickCustomerPhone}
                        onChange={(e) => setQuickCustomerPhone(e.target.value)}
                        placeholder="+91 9876543210 (Optional)"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b14] border border-[#1b2b42] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#080d16] border border-[#162338] text-[11px] text-slate-400 font-mono space-y-1">
                  <div className="flex justify-between">
                    <span>Payee VPA:</span>
                    <span className="text-emerald-300 font-bold">exploretheinsideexperiment@okaxis</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Security Model:</span>
                    <span className="text-teal-300">Single-Device Atomic Lock (Mobile OR Laptop)</span>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowQuickVerifyModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-[#142033] hover:bg-[#1a2b45] text-slate-300 font-semibold text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={quickLoading}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs hover:from-emerald-400 hover:to-teal-400 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {quickLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Recording...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Confirm & Generate Token</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Success Result Card */
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-1">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Payment Successfully Recorded & Verified!</h4>
                  <p className="text-xs text-emerald-300">
                    Total Revenue & Successful Payments metrics have updated in real-time.
                  </p>
                </div>

                {/* Token Display */}
                <div className="p-3.5 rounded-xl bg-[#070b14] border border-[#1b2b42] space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Generated Access Token:</span>
                    <span className="font-mono text-emerald-400 font-bold">{quickResult.tokenFormatted}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Protected Connected Link:</span>
                    <a
                      href={quickResult.protectedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-teal-400 hover:underline truncate max-w-[200px]"
                    >
                      {quickResult.protectedUrl}
                    </a>
                  </div>
                </div>

                {/* WhatsApp & Copy Message Buttons */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (quickResult.tokenMessage) {
                        navigator.clipboard.writeText(quickResult.tokenMessage);
                        setCopiedMsg(true);
                        setTimeout(() => setCopiedMsg(false), 2000);
                      }
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#142033] hover:bg-[#1a2b45] text-slate-200 border border-[#213550] text-xs font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    {copiedMsg ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedMsg ? 'Message Copied!' : 'Copy Token Message'}</span>
                  </button>

                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(quickResult.tokenMessage || '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Share on WhatsApp</span>
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => setShowQuickVerifyModal(false)}
                  className="w-full py-2.5 rounded-xl bg-[#101a2b] hover:bg-[#16253c] text-white font-semibold text-xs transition border border-[#1b2f4a]"
                >
                  Close & Return to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mid Section: Revenue Chart & Security Pulse */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Revenue Velocity Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0c1422] border border-[#18263a] shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Revenue & Payment Velocity
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Verified gateway collections (Past 7 days)</p>
            </div>
            {total7DayRevenue > 0 ? (
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ₹{total7DayRevenue.toLocaleString()} VERIFIED
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                AWAITING ACTIVITY
              </span>
            )}
          </div>

          {/* SVG Bar / Chart */}
          <div className="h-48 flex items-end justify-between gap-2 pt-4 px-2">
            {revenuePoints.map((pt, idx) => {
              const hasAmount = pt.amount > 0 && maxRevenue > 0;
              const heightPct = hasAmount ? Math.max(12, Math.round((pt.amount / maxRevenue) * 100)) : 0;
              const dateLabel = new Date(pt.date).toLocaleDateString('en-US', { weekday: 'short' });
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] font-mono text-emerald-400 opacity-0 group-hover:opacity-100 transition">
                    ₹{pt.amount}
                  </span>
                  <div className="w-full bg-[#142033] rounded-t-lg h-36 flex items-end p-1">
                    {hasAmount ? (
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-full rounded-md bg-gradient-to-t from-emerald-600 to-teal-400 group-hover:brightness-125 transition-all"
                      />
                    ) : (
                      <div className="w-full h-1 bg-slate-800/80 rounded-full" />
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">{dateLabel}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security Events Stream */}
        <div className="p-6 rounded-2xl bg-[#0c1422] border border-[#18263a] shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Live Security Stream
                </h2>
              </div>
              <button
                onClick={() => onNavigateTab('security')}
                className="text-xs text-emerald-400 hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {securityEvents.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs font-mono flex flex-col items-center justify-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-slate-600" />
                  <span>No security alerts yet. Defensive monitoring active.</span>
                </div>
              ) : (
                securityEvents.slice(0, 4).map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 rounded-xl bg-[#080d16] border border-[#162338] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                          evt.severity === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-400'
                            : evt.severity === 'HIGH'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {evt.type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-300 line-clamp-2 leading-relaxed">{evt.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#162338] flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Replay Protection:</span>
            <span className="text-emerald-400 font-bold">STRICT ENFORCED</span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Protected Resources & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Protected Resources */}
        <div className="p-6 rounded-2xl bg-[#0c1422] border border-[#18263a] shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Protected Resources ({resources.length})
            </h2>
            <button
              onClick={() => onNavigateTab('resources')}
              className="text-xs text-emerald-400 hover:underline"
            >
              Manage Resources
            </button>
          </div>

          <div className="space-y-3">
            {resources.slice(0, 4).map((res) => (
              <div
                key={res.id}
                className="p-3.5 rounded-xl bg-[#080d16] border border-[#162338] flex items-center justify-between hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{res.name}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#131f31] text-emerald-400 border border-[#1e304d]">
                      {res.currency} {res.price}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{res.description}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">
                    Validity: {res.tokenValidityHours}h | Max Uses: {res.maxUses}
                  </p>
                </div>

                <button
                  onClick={() => onOpenResource(res)}
                  className="p-2 rounded-lg bg-[#142033] hover:bg-[#1a2b45] text-slate-300 hover:text-white transition"
                  title="Generate QR or Edit"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions & Customer Token Status */}
        <div className="p-6 rounded-2xl bg-[#0c1422] border border-[#18263a] shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Recent Transactions ({sessions.length})
            </h2>
            <button
              onClick={() => onNavigateTab('transactions')}
              className="text-xs text-emerald-400 hover:underline"
            >
              All Transactions
            </button>
          </div>

          <div className="space-y-3">
            {sessions.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs font-mono flex flex-col items-center justify-center gap-2">
                <CreditCard className="w-6 h-6 text-slate-600" />
                <span>No transactions recorded yet. Live payment sessions will appear here.</span>
              </div>
            ) : (
              sessions.slice(0, 4).map((sess) => (
                <div
                  key={sess.id}
                  className="p-3.5 rounded-xl bg-[#080d16] border border-[#162338] flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{sess.customerName}</span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          sess.status === 'SUCCESS'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : sess.status === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {sess.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{sess.resourceName}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">
                      ID: {sess.gatewayOrderId}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-400 font-mono">
                      {sess.currency} {sess.amount}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {sess.paidAt ? new Date(sess.paidAt).toLocaleDateString() : 'Pending'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
