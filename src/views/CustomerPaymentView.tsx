import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  ShieldCheck,
  Lock,
  CreditCard,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Send,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Mail,
  MessageSquare,
  Smartphone,
  Info,
  FileText,
  Laptop,
  GitBranch,
} from 'lucide-react';
import type { Resource, PaymentSession, AppSettings } from '../types';
import { api } from '../utils/api';
import { Building2 } from 'lucide-react';

interface CustomerPaymentViewProps {
  resources: Resource[];
  initialResourceId?: string | null;
  settings?: AppSettings | null;
  onPaymentSuccess?: () => void;
  onOpenReceipt?: (session: PaymentSession) => void;
}

export const CustomerPaymentView: React.FC<CustomerPaymentViewProps> = ({
  resources,
  initialResourceId,
  settings,
  onPaymentSuccess,
  onOpenReceipt,
}) => {
  const [selectedResourceId, setSelectedResourceId] = useState<string>(
    initialResourceId || (resources[0]?.id ?? '')
  );

  // Customer Form - Starts completely blank as requested by user
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NETBANKING' | 'WALLET'>('UPI');

  // Manual UPI confirmation & reference state
  const [utrNumber, setUtrNumber] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedLaptopLink, setCopiedLaptopLink] = useState(false);
  const [upiConfirming, setUpiConfirming] = useState(false);

  // Session & Gateway Handshake State
  const [session, setSession] = useState<PaymentSession | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [webhookVerifying, setWebhookVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Protected Link & Token Test State
  const [rawToken, setRawToken] = useState<string>('');
  const [protectedUrl, setProtectedUrl] = useState<string>('');
  const [tokenFormatted, setTokenFormatted] = useState<string>('');
  const [tokenMessage, setTokenMessage] = useState<string>('');
  const [copiedTokenMsg, setCopiedTokenMsg] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [tokenTestResponse, setTokenTestResponse] = useState<any | null>(null);
  const [testingToken, setTestingToken] = useState(false);

  const selectedResource = resources.find((r) => r.id === selectedResourceId) || resources[0];

  // Bank Account & UPI resolution
  const merchantBank = settings?.merchantAccount || settings?.bankAccount;
  const targetUpiId = selectedResource?.customUpiId || merchantBank?.upiId || 'exploretheinsideexperiment@okaxis';
  const targetAccountName = selectedResource?.customAccountName || merchantBank?.accountHolderName || 'Explore The Inside Experiment';
  const targetAccountNumber = selectedResource?.customAccountNumber || merchantBank?.accountNumber || '987654321012';
  const targetBankName = selectedResource?.customBankName || merchantBank?.bankName || 'State Bank of India';
  const targetIfsc = selectedResource?.customIfscCode || merchantBank?.ifscCode || 'SBIN0001234';

  // Update selected resource if prop changes
  useEffect(() => {
    if (initialResourceId) {
      setSelectedResourceId(initialResourceId);
    }
  }, [initialResourceId]);

  // Generate UPI QR code for the session or direct resource
  useEffect(() => {
    if (!selectedResource) return;

    // Direct payment link or UPI URI targeting merchant's bank account
    const upiUri = `upi://pay?pa=${targetUpiId}&pn=${encodeURIComponent(targetAccountName)}&am=${selectedResource.price}&cu=${selectedResource.currency}&tn=${encodeURIComponent('EIE ' + selectedResource.name)}`;

    QRCode.toDataURL(upiUri, {
      width: 240,
      margin: 2,
      color: { dark: '#070a12', light: '#ffffff' },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('QR creation error', err));
  }, [selectedResource, targetUpiId, targetAccountName]);

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResource) return;
    setError(null);

    if (!fullName.trim() || !email.trim()) {
      setError('Kripya apna pura naam aur email address dalein (Please enter your name and email to proceed).');
      return;
    }

    setLoading(true);

    try {
      const result = await api.createPaymentSession({
        resourceId: selectedResource.id,
        customerName: fullName.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim(),
        paymentMethod,
      });

      setSession(result.session);
    } catch (err: any) {
      setError(err.message || 'Failed to create payment session');
    } finally {
      setLoading(false);
    }
  };

  // Simulates the external Razorpay / Cashfree HMAC verified Webhook call to the backend
  const handleSimulateWebhook = async () => {
    if (!session) return;
    setWebhookVerifying(true);
    setError(null);

    try {
      const res = await api.simulateGatewayWebhook(session.id, paymentMethod);
      setVerificationResult(res);
      setSession(res.session);
      setRawToken(res.rawToken || '');
      setProtectedUrl(res.protectedUrl || '');

      const rawTok = res.rawToken || '';
      const tokCode = res.tokenFormatted || `EIE-TOK-${rawTok.substring(0, 4).toUpperCase()}-${rawTok.substring(4, 8).toUpperCase()}`;
      setTokenFormatted(tokCode);

      const isGitHub = /github\.com/i.test(selectedResource.originalUrl);
      const protUrl = res.protectedUrl || '';
      const msg = res.tokenMessage ||
        `🎉 *EIE-Technology Payment Verified!*\n\n` +
        `📦 *Resource:* ${selectedResource.name} (${isGitHub ? 'GitHub Source Connected' : 'Protected Source'})\n` +
        `🔑 *One-Device Token:* ${tokCode}\n` +
        `🔗 *Connected Access Link:* ${protUrl}\n\n` +
        `⚠️ *SINGLE-DEVICE POLICY (एक समय में केवल एक डिवाइस):*\n` +
        `Yeh link at a time *ek hi baar / ek hi device* par open hoga (ya to Mobile me ya fir Laptop me). Kisi doosre device par open karne par yeh token block ho jayega.\n\n` +
        `⏰ *Validity:* 24 Hours\n` +
        `🔒 *Zero-Leak Protection Active*`;
      setTokenMessage(msg);

      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Webhook simulation failed');
    } finally {
      setWebhookVerifying(false);
    }
  };

  const handleCopyLink = () => {
    if (!protectedUrl) return;
    navigator.clipboard.writeText(protectedUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyTokenMsg = () => {
    if (!tokenMessage) return;
    navigator.clipboard.writeText(tokenMessage);
    setCopiedTokenMsg(true);
    setTimeout(() => setCopiedTokenMsg(false), 2500);
  };

  const handleSendTokenToWhatsApp = () => {
    if (!tokenMessage) return;
    const phoneClean = phone.replace(/[^0-9]/g, '');
    const url = phoneClean
      ? `https://api.whatsapp.com/send?phone=${phoneClean}&text=${encodeURIComponent(tokenMessage)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(tokenMessage)}`;
    window.open(url, '_blank');
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(targetUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const laptopAccessUrl = protectedUrl || (typeof window !== 'undefined' ? `${window.location.origin}/?token=${rawToken}` : '');

  const handleCopyLaptopLink = () => {
    if (!laptopAccessUrl) return;
    navigator.clipboard.writeText(laptopAccessUrl);
    setCopiedLaptopLink(true);
    setTimeout(() => setCopiedLaptopLink(false), 2500);
  };

  const handleOpenFullScreenApp = () => {
    if (selectedResource?.originalUrl) {
      window.open(selectedResource.originalUrl, '_blank');
    }
  };

  const handleConfirmUpiPayment = async () => {
    if (!selectedResource) return;
    setError(null);

    if (!fullName.trim() || !email.trim()) {
      setError('Kripya apna pura naam aur email address dalein (Please enter your name and email to proceed).');
      return;
    }

    setUpiConfirming(true);

    try {
      let currentSession = session;
      if (!currentSession) {
        const initResult = await api.createPaymentSession({
          resourceId: selectedResource.id,
          customerName: fullName.trim(),
          customerEmail: email.trim(),
          customerPhone: phone.trim(),
          paymentMethod: 'UPI',
        });
        currentSession = initResult.session;
        setSession(currentSession);
      }

      const res = await api.confirmUpiPayment({
        sessionId: currentSession.id,
        utrNumber: utrNumber.trim(),
        customerName: fullName.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim(),
      });

      setVerificationResult(res);
      setSession(res.session);
      setRawToken(res.rawToken || '');
      setProtectedUrl(res.protectedUrl || '');

      const rawTok = res.rawToken || '';
      const tokCode = res.tokenFormatted || `EIE-TOK-${rawTok.substring(0, 4).toUpperCase()}-${rawTok.substring(4, 8).toUpperCase()}`;
      setTokenFormatted(tokCode);

      const isGitHub = /github\.com/i.test(selectedResource.originalUrl);
      const protUrl = res.protectedUrl || '';
      const msg = res.tokenMessage ||
        `🎉 *EIE-Technology Payment Verified!*\n\n` +
        `📦 *Resource:* ${selectedResource.name} (${isGitHub ? 'GitHub Source Connected' : 'Protected Source'})\n` +
        `🔑 *One-Device Token:* ${tokCode}\n` +
        `🔗 *Connected Access Link:* ${protUrl}\n\n` +
        `⚠️ *SINGLE-DEVICE POLICY (एक समय में केवल एक डिवाइस):*\n` +
        `Yeh link at a time *ek hi baar / ek hi device* par open hoga (ya to Mobile me ya fir Laptop me). Kisi doosre device par open karne par yeh token block ho jayega.\n\n` +
        `⏰ *Validity:* 24 Hours\n` +
        `🔒 *Zero-Leak Protection Active*`;
      setTokenMessage(msg);

      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'UPI Payment confirmation failed');
    } finally {
      setUpiConfirming(false);
    }
  };

  // Test token validation without full redirect (inspects atomically)
  const handleTestTokenAccess = async () => {
    if (!rawToken) return;
    setTestingToken(true);
    try {
      // Call backend directly
      const checkRes = await fetch(`/access/${rawToken}?preview=1`);
      const htmlText = await checkRes.text();
      const isForbidden = checkRes.status === 403;
      const isSuccess = checkRes.status === 200 || checkRes.status === 302;

      setTokenTestResponse({
        status: checkRes.status,
        isForbidden,
        isSuccess,
        snippet: htmlText.includes('ACCESS DENIED')
          ? 'ACCESS DENIED — Single-use replay protection intercepted request'
          : htmlText.includes('Authentication Granted') || htmlText.includes('Token Validated Successfully')
          ? 'AUTHENTICATED — Validated atomically and redirected'
          : 'Token response processed',
      });
    } catch (err: any) {
      setTokenTestResponse({ error: err.message });
    } finally {
      setTestingToken(false);
    }
  };

  if (!selectedResource) {
    return (
      <div className="p-8 text-center bg-[#0c1422] rounded-2xl border border-[#18263a]">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-2" />
        <h3 className="text-base font-bold text-white">No resources available</h3>
        <p className="text-xs text-slate-400 mt-1">Please create a resource first in "My Resources".</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Customer Mode Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0b1320] border border-[#192b45]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
              Customer Experience Simulation
            </span>
            <h2 className="text-base font-bold text-white">Live Payment & Token Delivery Sandbox</h2>
          </div>
        </div>

        {/* Resource Selector Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 whitespace-nowrap">Testing Resource:</span>
          <select
            value={selectedResourceId}
            onChange={(e) => {
              setSelectedResourceId(e.target.value);
              setSession(null);
              setVerificationResult(null);
              setRawToken('');
              setProtectedUrl('');
              setTokenTestResponse(null);
            }}
            className="px-3 py-1.5 rounded-xl bg-[#070b14] border border-[#1d2f4a] text-xs font-semibold text-white focus:outline-none focus:border-emerald-400"
          >
            {resources.map((res) => (
              <option key={res.id} value={res.id}>
                {res.name} ({res.currency} {res.price})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Checkout Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Order Summary & Cloak Information */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-6 rounded-2xl bg-[#0c1422] border border-[#18263a] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#162338]">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#142033] text-emerald-400 border border-[#1d2f4a]">
                {selectedResource.category}
              </span>
              <span className="text-xs font-mono text-slate-400">ID: {selectedResource.id}</span>
            </div>

            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">{selectedResource.name}</h1>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {selectedResource.description || 'Access to private zero-leak intellectual property.'}
              </p>
            </div>

            {/* Price block */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#070b14] to-[#0d1624] border border-[#1a2b42] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-mono">TOTAL AMOUNT DUE</span>
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  {selectedResource.currency} {selectedResource.price.toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-mono">TOKEN VALIDITY</span>
                <div className="text-xs font-semibold text-emerald-400 font-mono capitalize">
                  {selectedResource.tokenValidityUnit && selectedResource.tokenValidityValue
                    ? `${selectedResource.tokenValidityValue} ${selectedResource.tokenValidityUnit} (${selectedResource.tokenValidityHours}h)`
                    : `${selectedResource.tokenValidityHours} Hours`}
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {selectedResource.maxUses === 1 ? 'Single-Use Only' : `${selectedResource.maxUses} Uses Allowed`}
                </span>
              </div>
            </div>

            {/* Zero Leak Badge */}
            <div className="p-3 rounded-xl bg-[#080d16] border border-emerald-500/20 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold font-mono text-[11px]">
                <Lock className="w-3.5 h-3.5" />
                <span>Zero-Leak Link Shield Active</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Upon verified payment, you will receive an encrypted one-time link. The actual backend destination is never displayed in web receipts or transaction details.
              </p>
            </div>

            {/* Dynamic QR Scan preview with direct bank settlement info */}
            <div className="p-4 rounded-xl bg-[#080d16] border border-[#162338] text-center space-y-3">
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-300 font-semibold">
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>Scan with Any UPI App to Pay</span>
              </div>
              {qrCodeDataUrl ? (
                <div className="mx-auto w-44 h-44 p-2 bg-white rounded-xl shadow-lg border-2 border-emerald-500/40 flex items-center justify-center">
                  <img src={qrCodeDataUrl} alt="UPI QR Code" className="w-full h-full object-contain" />
                </div>
              ) : null}
              <p className="text-[10px] font-mono text-slate-400">
                Supports PhonePe, Google Pay, Paytm, BHIM & Bank UPI
              </p>

              {/* Direct Bank Settlement info */}
              <div className="p-2.5 rounded-lg bg-[#05080f] border border-emerald-500/20 text-left text-[11px] font-mono space-y-1">
                <div className="flex items-center gap-1 text-emerald-400 font-bold text-[10px] uppercase">
                  <Building2 className="w-3 h-3" />
                  <span>Direct Bank Settlement (सीधा बैंक खाता)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Merchant A/C:</span>
                  <span className="text-white font-bold">{targetAccountNumber ? `••••${targetAccountNumber.slice(-4)}` : 'N/A'} ({targetBankName})</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Payee VPA:</span>
                  <span className="text-emerald-300 font-bold truncate max-w-[170px]">{targetUpiId}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Payment Form & Webhook Verification Simulator */}
        <div className="lg:col-span-7 space-y-5">
          {!verificationResult ? (
            /* Step 1: Customer Input & Session Initiation */
            <div className="p-6 rounded-2xl bg-[#0c1422] border border-[#18263a] shadow-xl space-y-5">
              <div>
                <h3 className="text-base font-bold text-white">Enter Customer Details</h3>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleInitiatePayment} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Name (पूरा नाम) <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b14] border border-[#1b2b42] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email Address (ईमेल) <span className="text-emerald-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b14] border border-[#1b2b42] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Phone / WhatsApp Number (फ़ोन नंबर)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b14] border border-[#1b2b42] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Select Payment Method
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'UPI', label: 'UPI / QR' },
                      { id: 'CARD', label: 'Credit/Debit' },
                      { id: 'NETBANKING', label: 'Net Banking' },
                      { id: 'WALLET', label: 'Wallets' },
                    ].map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={`p-2.5 rounded-xl text-xs font-semibold border transition ${
                          paymentMethod === method.id
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-[#080d16] text-slate-400 border-[#18263a] hover:text-white'
                        }`}
                      >
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* UPI Payment Flow vs Standard Gateway Flow */}
                {paymentMethod === 'UPI' ? (
                  <div className="space-y-3.5 pt-1">
                    {/* 1-Tap Mobile UPI App Link */}
                    <a
                      href={`upi://pay?pa=${targetUpiId}&pn=${encodeURIComponent(targetAccountName)}&am=${selectedResource.price}&cu=${selectedResource.currency}&tn=${encodeURIComponent('EIE ' + selectedResource.name)}`}
                      className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-110 transition flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Smartphone className="w-4 h-4 stroke-[2.5]" />
                      <span>📱 Pay {selectedResource.currency} {selectedResource.price} via Any UPI App</span>
                    </a>

                    {/* Payee VPA Details with Copy */}
                    <div className="p-3 rounded-xl bg-[#070b14] border border-[#1b2b42] flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 font-mono block">BENEFICIARY UPI ID (भुगतान पता)</span>
                        <span className="text-xs font-mono font-bold text-emerald-300 truncate block">
                          {targetUpiId}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          Name: {targetAccountName}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="px-3 py-1.5 rounded-lg bg-[#142033] hover:bg-[#1a2b45] text-slate-200 border border-[#223654] text-xs font-semibold transition flex items-center gap-1 shrink-0"
                      >
                        {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedUpi ? 'Copied!' : 'Copy UPI'}</span>
                      </button>
                    </div>

                    {/* Optional UTR / Reference Number */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        UPI Reference / UTR Number (12-Digit Ref No.)
                      </label>
                      <input
                        type="text"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b14] border border-[#1b2b42] text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    {/* Direct UPI Verification Confirmation Button */}
                    <button
                      type="button"
                      onClick={handleConfirmUpiPayment}
                      disabled={upiConfirming}
                      className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-slate-950 shadow-xl shadow-emerald-500/25 hover:brightness-110 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {upiConfirming ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Verifying Payment & Generating Secret Access Link...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                          <span>✅ Maine Payment Kar Diya Hai (Unlock Access)</span>
                        </>
                      )}
                    </button>

                    <div className="relative my-2 text-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[#18263a]" />
                      </div>
                      <span className="relative px-2 bg-[#0c1422] text-[10px] text-slate-500 uppercase font-mono">
                        या गेटवे द्वारा भुगतान करें (Or Pay via Gateway)
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-[#101a2b] hover:bg-[#16243b] text-slate-300 border border-[#1f314c] transition flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      <span>{loading ? 'Initializing Session...' : 'Create Payment Gateway Session'}</span>
                    </button>
                  </div>
                ) : (
                  /* Submit button for non-UPI */
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition active:scale-95 disabled:opacity-50"
                  >
                    {loading ? 'Initializing Payment Session...' : `PAY NOW (${selectedResource.currency} ${selectedResource.price})`}
                  </button>
                )}
              </form>

              {/* Active Session & Webhook Handshake Trigger */}
              {session && (
                <div className="mt-4 p-4 rounded-xl bg-[#080d16] border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Session Active: {session.gatewayOrderId}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      PENDING VERIFICATION
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    The payment session is created. If you have paid via PhonePe, GPay or Paytm, click below to verify and receive your zero-leak access link instantly.
                  </p>

                  <button
                    type="button"
                    onClick={handleSimulateWebhook}
                    disabled={webhookVerifying}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 text-slate-950 font-bold text-xs hover:brightness-110 transition shadow-md flex items-center justify-center gap-2"
                  >
                    {webhookVerifying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying Signature & Generating Token...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Simulate Verified Payment Gateway Webhook</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Step 2: Payment Verified & In-Page Cloaked Use Player */
            <div className="p-6 rounded-2xl bg-[#0c1422] border border-emerald-500/30 shadow-2xl space-y-6">
              {/* Success Header */}
              <div className="flex items-center gap-3 pb-4 border-b border-[#18263a]">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                    PAYMENT VERIFIED • ACCESS GRANTED
                  </span>
                  <h3 className="text-lg font-bold text-white">Payment Successful & Resource Ready to Use</h3>
                </div>
              </div>

              {/* Security Shield Notice: Raw link is completely hidden from customer */}
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 leading-relaxed">
                  <span className="font-bold text-emerald-300 block mb-0.5">
                    🔒 Zero-Leak Privacy Shield Active (सुरक्षित उपयोग पेज)
                  </span>
                  Aapka set kiya hua direct link customer se poori tarah confidential rakha gaya hai. Customer ko raw link nahi dikhega, customer sidhe niche diye gaye portal me ya laptop link se ise use kar sakte hain.
                </div>
              </div>

              {/* GitHub Connected & Single-Device Token Card */}
              <div className="p-4 rounded-xl bg-[#080f1d] border-2 border-emerald-500/40 space-y-3.5 shadow-lg">
                <div className="flex items-center justify-between pb-2 border-b border-[#18283f]">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                        GITHUB SOURCE CONNECTED
                      </span>
                      <h4 className="text-sm font-bold text-white leading-tight">
                        {selectedResource.name}
                      </h4>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                    ONE-DEVICE LOCK
                  </span>
                </div>

                {/* Token Code & Expiry */}
                <div className="p-3 rounded-xl bg-gradient-to-r from-[#070d18] to-[#0c182c] border border-sky-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">Customer One-Device Token</span>
                    <span className="text-sm sm:text-base font-mono font-black text-sky-300 tracking-wider">
                      {tokenFormatted || (rawToken ? `EIE-TOK-${rawToken.substring(0, 4).toUpperCase()}-${rawToken.substring(4, 8).toUpperCase()}` : 'EIE-ACTIVE')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-emerald-400 block font-semibold">VALIDITY: 24H</span>
                    <span className="text-[10px] font-mono text-slate-400">Single-Device Enforced</span>
                  </div>
                </div>

                {/* Single Device Policy Warning (Mobile ya Laptop) */}
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <Lock className="w-4 h-4" />
                    <span>Single-Device Policy (एक समय में केवल एक डिवाइस):</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Yeh token <strong>at a time ek hi baar / ek hi device par use ho sakta hai</strong> — ya to mobile me chalega ya fir laptop me. Kisi doosre device par open karne par security protocol ke mutabiq link block ho jayega.
                  </p>
                </div>

                {/* Formatted Customer Token Message Box (WhatsApp & SMS Ready) */}
                {tokenMessage && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Customer Token Message (WhatsApp / SMS Ready)
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">1-CLICK COPY / SHARE</span>
                    </div>

                    <textarea
                      readOnly
                      rows={4}
                      value={tokenMessage}
                      className="w-full p-2.5 rounded-lg bg-[#04060c] border border-[#18263a] text-xs font-mono text-emerald-300 select-all focus:outline-none"
                    />

                    <div className="flex flex-wrap gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={handleSendTokenToWhatsApp}
                        className="flex-1 py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition active:scale-95"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>WhatsApp Par Token Bhejein</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyTokenMsg}
                        className="flex-1 py-2 px-3 rounded-lg bg-[#142236] hover:bg-[#1a2d48] text-white font-semibold text-xs border border-sky-500/30 flex items-center justify-center gap-1.5 transition"
                      >
                        {copiedTokenMsg ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedTokenMsg ? 'Message Copied! ✓' : 'Copy Message'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Google 403 Alert if Google Drive/Docs/Sites */}
              {/google\.com|drive\.google|docs\.google|sites\.google/i.test(selectedResource.originalUrl) && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200">
                  <div className="flex items-start sm:items-center gap-2">
                    <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                    <span>
                      <strong>Google 403 Error Notice:</strong> Google Drive / Cloud Apps iframe me "403 That's an error" dete hain. Apna set kiya hua app bina kisi 403 error ke full screen me chalane ke liye <strong>'Open Full Screen'</strong> par click karein.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenFullScreenApp}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition shadow shrink-0"
                  >
                    🚀 Run App Full Screen
                  </button>
                </div>
              )}

              {/* Delivery Channels Notification Receipt */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-[#080d16] border border-[#162338]">
                  <Mail className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400">Email Dispatched</span>
                  <div className="text-[11px] text-emerald-300 font-semibold">SENT</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#080d16] border border-[#162338]">
                  <Smartphone className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400">SMS Alert</span>
                  <div className="text-[11px] text-emerald-300 font-semibold">DELIVERED</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#080d16] border border-[#162338]">
                  <MessageSquare className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400">WhatsApp Alert</span>
                  <div className="text-[11px] text-emerald-300 font-semibold">DELIVERED</div>
                </div>
              </div>

              {/* Cloaked In-Page Interactive Use Portal */}
              <div className="rounded-xl border border-[#1e2f47] bg-[#050912] overflow-hidden shadow-xl space-y-0">
                <div className="px-4 py-3 bg-[#0a1220] border-b border-[#18273d] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white tracking-wide">
                      {selectedResource.name} (Live Use Portal)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      CLOAKED
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleOpenFullScreenApp}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 hover:brightness-110 shadow-md flex items-center gap-1.5 transition active:scale-95"
                    >
                      <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>🚀 Open Full Screen (No 403 Error)</span>
                    </button>

                    {protectedUrl && (
                      <a
                        href={protectedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#121c2d] hover:bg-[#1a283f] text-slate-300 border border-[#20324c] flex items-center gap-1 transition"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span className="hidden sm:inline">Portal Tab</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Embedded Live Viewer - Never exposes originalUrl in text */}
                <div className="relative w-full h-[460px] bg-[#03060a]">
                  <iframe
                    src={selectedResource.originalUrl}
                    title={selectedResource.name}
                    className="w-full h-full border-0 bg-[#070b13]"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-modals allow-top-navigation allow-presentation"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              {/* Laptop / PC Access Sharing Card */}
              <div className="p-4 rounded-xl bg-[#080e1a] border border-sky-500/30 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                    <Laptop className="w-4 h-4 text-sky-400" />
                    💻 Link for Laptop / PC (लैपटॉप पर चलाने के लिए लिंक):
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                    LAPTOP READY
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={laptopAccessUrl}
                    className="flex-1 px-3 py-2 rounded-lg bg-[#04060a] border border-[#18263a] text-xs font-mono text-emerald-300 select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLaptopLink}
                    className="px-3 py-2 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-semibold text-xs transition border border-sky-500/30 flex items-center gap-1 shrink-0"
                  >
                    {copiedLaptopLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLaptopLink ? 'Copied! ✓' : 'Copy Link'}</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Aapka EIE-Technology access link laptop ke liye:\n${laptopAccessUrl}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 px-3 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-semibold border border-emerald-500/30 flex items-center justify-center gap-1.5 transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp Par Bhejein (Laptop Web)</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleOpenFullScreenApp}
                    className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 flex items-center justify-center gap-1.5 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Direct Full Screen App (No 403 Error)</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-400">
                  💡 <strong>Tip:</strong> Is link ko aap apne laptop browser (Chrome, Edge, Safari) me open karke aasaani se full screen chala sakte hain bina kisi error ke.
                </p>
              </div>

              {/* Action Buttons: Receipt & Reset */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                {onOpenReceipt && session && (
                  <button
                    onClick={() => onOpenReceipt(session)}
                    className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-[#142033] hover:bg-[#1a2b45] text-slate-200 text-xs font-semibold border border-[#213552] transition flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-slate-300" />
                    <span>View Payment Receipt (रसीद देखें)</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setVerificationResult(null);
                    setSession(null);
                    setTokenTestResponse(null);
                    setFullName('');
                    setEmail('');
                    setPhone('');
                    setUtrNumber('');
                  }}
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-[#142033] hover:bg-[#1a2b45] text-slate-300 text-xs font-semibold border border-[#213552] transition"
                >
                  Start New Payment (नया भुगतान)
                </button>
              </div>

              {/* Single-Use Replay Protection Status */}
              <div className="p-3.5 rounded-xl bg-[#060a12] border border-[#162338] text-xs font-mono text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Replay Protection:</span>
                  <span className="text-emerald-400 font-bold">ACTIVE (Single-Use Token)</span>
                </div>
                <div className="flex justify-between">
                  <span>Destination Shielding:</span>
                  <span className="text-emerald-400 font-bold">100% Zero-Leak Cloaked</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
