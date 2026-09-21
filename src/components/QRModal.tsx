import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Download,
  Printer,
  Share2,
  RefreshCw,
  ShieldCheck,
  Check,
  Copy,
  Building2,
  QrCode,
  ArrowRight,
  ExternalLink,
  Smartphone,
  CheckCircle2,
  MessageSquare,
  Lock,
  Laptop,
  AlertTriangle,
  GitBranch,
} from 'lucide-react';
import type { Resource, AppSettings } from '../types';
import { buildPaymentPortalUrl, getAppBaseUrl } from '../utils/urlHelper';
import { api } from '../utils/api';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: Resource | null;
  settings?: AppSettings | null;
  onOpenCheckout?: (resource: Resource) => void;
  onPaymentSuccess?: () => void;
}

export const QRModal: React.FC<QRModalProps> = ({
  isOpen,
  onClose,
  resource,
  settings,
  onOpenCheckout,
  onPaymentSuccess,
}) => {
  const [qrType, setQrType] = useState<'checkout' | 'direct_upi'>('checkout');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [qrRevision, setQrRevision] = useState(1);

  // Post-payment verification & Token Claim state
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimPhone, setClaimPhone] = useState('');
  const [claimName, setClaimName] = useState('Valued Customer');
  const [claimEmail, setClaimEmail] = useState('customer@eie-technology.com');
  const [claimUtr, setClaimUtr] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimedAccess, setClaimedAccess] = useState<{
    tokenCode: string;
    protectedUrl: string;
    tokenMessage: string;
    rawToken: string;
    resourceName: string;
    isGitHub: boolean;
    githubLinkDisplay?: string;
  } | null>(null);
  const [copiedTokenMsg, setCopiedTokenMsg] = useState(false);
  const [copiedAccessUrl, setCopiedAccessUrl] = useState(false);

  // Settlement bank account details
  const merchantBank = settings?.merchantAccount || settings?.bankAccount;
  const targetAccountNumber = resource?.customAccountNumber || merchantBank?.accountNumber || '987654321012';
  const targetAccountHolder = resource?.customAccountName || merchantBank?.accountHolderName || 'Explore The Inside Experiment';
  const targetBankName = resource?.customBankName || merchantBank?.bankName || 'State Bank of India';
  const targetIfsc = resource?.customIfscCode || merchantBank?.ifscCode || 'SBIN0001234';
  const targetUpiId = resource?.customUpiId || merchantBank?.upiId || 'exploretheinsideexperiment@okaxis';

  // Resolves the full URL preserving GitHub Pages repository path (e.g. /EIE-TECHNOLOGY/)
  const paymentPortalUrl = resource
    ? buildPaymentPortalUrl(resource.id, qrRevision)
    : `${getAppBaseUrl()}?pay=general`;

  const directUpiUri = resource
    ? `upi://pay?pa=${targetUpiId}&pn=${encodeURIComponent(targetAccountHolder)}&am=${resource.price}&cu=${resource.currency}&tn=${encodeURIComponent('EIE ' + resource.name)}`
    : `upi://pay?pa=${targetUpiId}&pn=${encodeURIComponent(targetAccountHolder)}&cu=INR`;

  const currentQrString = qrType === 'checkout' ? paymentPortalUrl : directUpiUri;

  useEffect(() => {
    if (!isOpen || !resource) return;

    let mounted = true;
    setGenerating(true);

    QRCode.toDataURL(currentQrString, {
      width: 380,
      margin: 2,
      color: {
        dark: '#070a12',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        if (mounted) {
          setQrDataUrl(url);
          setGenerating(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate QR code', err);
        setGenerating(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, resource, qrRevision, currentQrString, qrType]);

  if (!isOpen || !resource) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentQrString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `EIE_${qrType === 'direct_upi' ? 'Direct_UPI_Bank_QR' : 'Payment_QR'}_${resource.name.replace(/[^a-z0-9]/gi, '_')}.png`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${resource.name} | EIE-Technology`,
          text: `Pay for ${resource.name} securely via EIE-Technology (${resource.currency} ${resource.price})`,
          url: currentQrString,
        });
      } catch (err) {
        // user cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  const handleClaimPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resource) return;
    setClaimLoading(true);
    setClaimError(null);

    try {
      // 1. Create a session for this resource
      const sessRes = await api.createPaymentSession({
        resourceId: resource.id,
        customerName: claimName.trim() || 'Valued Customer',
        customerEmail: claimEmail.trim() || 'customer@eie-technology.com',
        customerPhone: claimPhone.trim() || '',
        paymentMethod: 'UPI',
      });

      // 2. Confirm the direct UPI payment
      const confirmRes = await api.confirmUpiPayment({
        sessionId: sessRes.session.id,
        utrNumber: claimUtr.trim() || undefined,
        customerName: claimName.trim() || 'Valued Customer',
        customerEmail: claimEmail.trim() || 'customer@eie-technology.com',
        customerPhone: claimPhone.trim() || '',
      });

      const rawTok = confirmRes.rawToken || '';
      const tokenFormatted =
        confirmRes.tokenFormatted ||
        `EIE-TOK-${rawTok.substring(0, 4).toUpperCase()}-${rawTok.substring(4, 8).toUpperCase()}`;
      const protectedUrl =
        confirmRes.protectedUrl ||
        confirmRes.session?.protectedUrl ||
        `${window.location.origin}?token=${rawTok}`;
      const isGitHub = /github\.com/i.test(resource.originalUrl);

      const tokenMessage =
        confirmRes.tokenMessage ||
        `🎉 *EIE-Technology Payment Verified!*\n\n` +
        `📦 *Resource:* ${resource.name} (${isGitHub ? 'GitHub Source Connected' : 'Protected Source'})\n` +
        `🔑 *One-Device Token:* ${tokenFormatted}\n` +
        `🔗 *Connected Access Link:* ${protectedUrl}\n\n` +
        `⚠️ *SINGLE-DEVICE POLICY (एक समय में केवल एक डिवाइस):*\n` +
        `Yeh link at a time *ek hi baar / ek hi device* par open hoga (ya to Mobile me ya fir Laptop me). Kisi doosre device par open karne par yeh token block ho jayega.\n\n` +
        `⏰ *Validity:* 24 Hours\n` +
        `🔒 *Zero-Leak Protection Active*`;

      setClaimedAccess({
        tokenCode: tokenFormatted,
        protectedUrl,
        tokenMessage,
        rawToken: rawTok,
        resourceName: resource.name,
        isGitHub,
        githubLinkDisplay: isGitHub ? resource.originalUrl.replace(/^https?:\/\//, '') : undefined,
      });

      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
    } catch (err: any) {
      setClaimError(err.message || 'Payment verification failed. Please try again.');
    } finally {
      setClaimLoading(false);
    }
  };

  const handleCopyTokenMessage = () => {
    if (!claimedAccess) return;
    navigator.clipboard.writeText(claimedAccess.tokenMessage);
    setCopiedTokenMsg(true);
    setTimeout(() => setCopiedTokenMsg(false), 2500);
  };

  const handleCopyAccessUrl = () => {
    if (!claimedAccess) return;
    navigator.clipboard.writeText(claimedAccess.protectedUrl);
    setCopiedAccessUrl(true);
    setTimeout(() => setCopiedAccessUrl(false), 2500);
  };

  const handleSendToWhatsApp = () => {
    if (!claimedAccess) return;
    const phoneClean = claimPhone.replace(/[^0-9]/g, '');
    const url = phoneClean
      ? `https://api.whatsapp.com/send?phone=${phoneClean}&text=${encodeURIComponent(claimedAccess.tokenMessage)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(claimedAccess.tokenMessage)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-[#0c1422] border border-[#1e2f47] rounded-2xl shadow-2xl flex flex-col max-h-[94vh] sm:max-h-[90vh] my-auto overflow-hidden print:m-0 print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Modal Top Bar */}
        <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#18263a] bg-[#090d16] print:hidden z-10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold text-white">Payment QR Generator</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 sm:p-6 text-center space-y-4 overscroll-contain">
          {/* Header Info */}
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              EIE-TECHNOLOGY ZERO-LEAK ENGINE
            </span>
            <h3 className="text-base font-bold text-white mt-1.5 print:text-black">{resource.name}</h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5 print:text-gray-600">
              Amount: <strong className="text-emerald-400 font-bold">{resource.currency} {resource.price}</strong> | Gate: {resource.paymentGateway}
            </p>
          </div>

          {/* QR Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#070b14] border border-[#162338] rounded-xl print:hidden">
            <button
              type="button"
              onClick={() => setQrType('checkout')}
              className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                qrType === 'checkout'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Encrypted Web Portal QR
            </button>
            <button
              type="button"
              onClick={() => setQrType('direct_upi')}
              className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                qrType === 'direct_upi'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Direct Bank Account QR (सीधा खाता)
            </button>
          </div>

          {/* Scanner Guidance Note */}
          <div className="p-2 rounded-lg bg-[#070b14] border border-[#162338] text-[11px] font-mono text-slate-300 flex items-center justify-center gap-1.5 print:hidden">
            {qrType === 'checkout' ? (
              <>
                <Smartphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Camera / Google Lens / Browser Scanner se scan karein (वेब पेज खुलेगा)</span>
              </>
            ) : (
              <>
                <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>GPay / PhonePe / Paytm / BHIM UPI app se scan karein (बैंक ट्रांसफर)</span>
              </>
            )}
          </div>

          {/* QR Code Container with visual security styling */}
          <div className="relative mx-auto w-60 h-60 p-3 bg-white rounded-2xl shadow-xl flex items-center justify-center border-4 border-emerald-400/80">
            {generating ? (
              <div className="flex flex-col items-center gap-2 text-slate-700">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                <span className="text-xs font-mono font-semibold">Generating QR...</span>
              </div>
            ) : qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="EIE Payment QR"
                className="w-full h-full object-contain rounded-lg"
              />
            ) : null}

            {/* Brand center emblem overlay badge */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-[#090d16] border-2 border-emerald-400 flex items-center justify-center shadow-lg pointer-events-none">
              <span className="text-[10px] font-black text-emerald-400 font-mono">EIE</span>
            </div>
          </div>

          {/* Destination Bank Account Details (Mera account no display & verification) */}
          <div className="p-3 rounded-xl bg-[#080d16] border border-emerald-500/30 text-left text-xs space-y-1.5">
            <div className="flex items-center justify-between text-emerald-400 font-mono text-[11px] font-bold">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>Paisa Sidha Bank Account Me Aayega</span>
              </div>
              <span className="text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                DIRECT A/C
              </span>
            </div>

            <div className="space-y-1 text-slate-300 font-mono text-[11px] pt-1 border-t border-[#162338]">
              <div className="flex justify-between">
                <span className="text-slate-400">Bank Account:</span>
                <span className="text-white font-bold tracking-wider">{targetAccountNumber ? `••••${targetAccountNumber.slice(-4)}` : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Account Holder:</span>
                <span className="text-white truncate max-w-[200px]">{targetAccountHolder}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bank & IFSC:</span>
                <span className="text-slate-300">{targetBankName} ({targetIfsc})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Merchant UPI ID:</span>
                <span className="text-emerald-400 font-bold">{targetUpiId}</span>
              </div>
            </div>
          </div>

          {/* Protected URL or UPI string */}
          <div className="p-3 rounded-xl bg-[#080d16] border border-[#162338] text-left text-xs font-mono print:border-gray-200">
            <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
              <span>{qrType === 'checkout' ? 'QR Targets Protected Portal:' : 'UPI Deep-Link Intent:'}</span>
              <span className="text-emerald-400 font-bold">{qrType === 'checkout' ? '100% PRIVATE' : 'DIRECT UPI'}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#04060a] p-1.5 rounded-lg border border-[#141e2e]">
              <div className="truncate text-slate-200 text-[11px] select-all flex-1 px-1">
                {currentQrString}
              </div>
              {qrType === 'checkout' && (
                <a
                  href={currentQrString}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 rounded text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 transition shrink-0"
                  title="Open in new tab to test"
                >
                  <span>Test Link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">
              🔒 <strong className="text-slate-300">Security Guarantee:</strong> The private destination link is never exposed until successful payment.
            </p>
          </div>

          {/* Actions (print hidden) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 print:hidden">
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-[#142033] hover:bg-[#1a2b45] text-white text-xs font-medium border border-[#213552] transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Link'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-[#142033] hover:bg-[#1a2b45] text-white text-xs font-medium border border-[#213552] transition"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-[#142033] hover:bg-[#1a2b45] text-white text-xs font-medium border border-[#213552] transition"
            >
              <Printer className="w-3.5 h-3.5 text-sky-400" />
              <span>Print</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-[#142033] hover:bg-[#1a2b45] text-white text-xs font-medium border border-[#213552] transition"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Share</span>
            </button>
          </div>

          {/* Claim Token & Link Workflow (Post-Payment Delivery) */}
          {claimedAccess ? (
            <div className="p-4 rounded-xl bg-[#09111e] border-2 border-emerald-500/40 text-left space-y-3.5 shadow-xl print:hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-[#18283f]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                      PAYMENT VERIFIED • ACCESS UNLOCKED
                    </span>
                    <h4 className="text-sm font-bold text-white leading-tight">
                      Aapka Token & GitHub Access Link Ready Hai!
                    </h4>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                  ONE-DEVICE
                </span>
              </div>

              {/* GitHub Connected Notification */}
              <div className="p-2.5 rounded-lg bg-[#050810] border border-emerald-500/30 text-xs flex items-center gap-2 text-slate-200">
                <GitBranch className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-emerald-300">Set Kiya Gaya GitHub Link Connected:</span>
                  <p className="text-[11px] text-slate-400 truncate">
                    {claimedAccess.isGitHub ? claimedAccess.githubLinkDisplay : claimedAccess.resourceName} (Zero-Leak Shielded)
                  </p>
                </div>
              </div>

              {/* Token Code Display */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-[#0a1526] to-[#0d1d33] border border-sky-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">Single-Device Access Token</span>
                  <span className="text-sm font-mono font-black text-sky-300 tracking-wider">
                    {claimedAccess.tokenCode}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-emerald-400 block font-semibold">VALIDITY: 24H</span>
                  <span className="text-[10px] font-mono text-slate-400">Single-Device Lock</span>
                </div>
              </div>

              {/* Single Device Policy Warning (Mobile ya Laptop) */}
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Single-Device Policy (एक समय में केवल एक डिवाइस):</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Yeh token <strong>at a time ek hi baar / ek hi device par use ho sakta hai</strong> — ya to mobile me chalega ya fir laptop me. Kisi doosre device par open karne par security ke tahat block ho jayega.
                </p>
              </div>

              {/* Formatted Customer Token Message Box */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Customer Token Message (WhatsApp & SMS Ready)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">1-CLICK COPY</span>
                </label>
                <textarea
                  readOnly
                  rows={4}
                  value={claimedAccess.tokenMessage}
                  className="w-full p-2.5 rounded-lg bg-[#04060c] border border-[#18263a] text-xs font-mono text-emerald-300 select-all focus:outline-none"
                />
              </div>

              {/* Action Buttons: WhatsApp Send & Direct Open */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSendToWhatsApp}
                  className="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp Par Token Message Bhejein</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyTokenMessage}
                  className="py-2.5 px-3 rounded-xl bg-[#142236] hover:bg-[#1a2d48] text-white font-semibold text-xs border border-sky-500/30 flex items-center justify-center gap-1.5 transition"
                >
                  {copiedTokenMsg ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedTokenMsg ? 'Message Copied! ✓' : 'Copy Full Message'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a
                  href={claimedAccess.protectedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow transition active:scale-95"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>🚀 Open Connected GitHub App</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyAccessUrl}
                  className="py-2.5 px-3 rounded-xl bg-[#101a2b] hover:bg-[#17253d] text-sky-300 font-semibold text-xs border border-[#1f3350] flex items-center justify-center gap-1.5 transition"
                >
                  <Laptop className="w-4 h-4 text-sky-400" />
                  <span>{copiedAccessUrl ? 'Link Copied! ✓' : 'Copy Laptop Link'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Claim Trigger Section */
            <div className="pt-2 print:hidden space-y-2">
              {!showClaimForm ? (
                <button
                  type="button"
                  onClick={() => setShowClaimForm(true)}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-110 transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>✅ Maine Scanner Par Payment Kar Diya (Claim Token & GitHub Link)</span>
                </button>
              ) : (
                <form onSubmit={handleClaimPayment} className="p-4 rounded-xl bg-[#080e1a] border border-emerald-500/30 text-left space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-[#162438]">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Payment Verification & Token Generation
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowClaimForm(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>

                  {claimError && (
                    <div className="p-2 rounded bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{claimError}</span>
                    </div>
                  )}

                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Customer WhatsApp / Mobile No. (Token Message paane ke liye)
                      </label>
                      <input
                        type="tel"
                        value={claimPhone}
                        onChange={(e) => setClaimPhone(e.target.value)}
                        placeholder="e.g. 9876543210 (WhatsApp Number)"
                        className="w-full px-3 py-2 rounded-lg bg-[#04060c] border border-[#1b2b42] text-white text-xs font-mono focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">Name</label>
                        <input
                          type="text"
                          value={claimName}
                          onChange={(e) => setClaimName(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-[#04060c] border border-[#1b2b42] text-white text-xs focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">UPI Ref / UTR (Optional)</label>
                        <input
                          type="text"
                          value={claimUtr}
                          onChange={(e) => setClaimUtr(e.target.value)}
                          placeholder="12-digit UTR"
                          className="w-full px-3 py-2 rounded-lg bg-[#04060c] border border-[#1b2b42] text-white text-xs font-mono focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-tight">
                    🔒 Payment verify hone ke turant baad aapke set kiye gaye GitHub link se connected One-Device Token aur Access Link prapt ho jayega.
                  </p>

                  <button
                    type="submit"
                    disabled={claimLoading}
                    className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow hover:brightness-110 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {claimLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying Payment & Generating One-Device Token...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>🚀 Verify & Unlock My Token & GitHub Access Link</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Open Checkout Simulator CTA */}
          {onOpenCheckout && (
            <div className="pt-1 print:hidden">
              <button
                onClick={() => {
                  onClose();
                  onOpenCheckout(resource);
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#142236] hover:bg-[#1a2d48] text-slate-300 hover:text-white border border-[#213552] transition shadow active:scale-95"
              >
                Open Full Checkout View for this QR →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

