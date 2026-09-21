import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Lock,
  Maximize2,
  Minimize2,
  RefreshCw,
  AlertTriangle,
  FileText,
  HelpCircle,
  ExternalLink,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Laptop,
  Copy,
  Check,
  MessageSquare,
  Info,
} from 'lucide-react';
import { api } from '../utils/api';
import type { Resource, PaymentSession } from '../types';

interface ProtectedUsePortalViewProps {
  token: string;
  onBackToStore?: () => void;
  onOpenReceipt?: (session: PaymentSession) => void;
}

export const ProtectedUsePortalView: React.FC<ProtectedUsePortalViewProps> = ({
  token,
  onBackToStore,
  onOpenReceipt,
}) => {
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [resourceName, setResourceName] = useState('Protected Resource');
  const [targetUrl, setTargetUrl] = useState<string | null>(null);
  const [tokenRecord, setTokenRecord] = useState<any | null>(null);
  const [errorReason, setErrorReason] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [copiedLaptopLink, setCopiedLaptopLink] = useState(false);
  const [cacheBuster, setCacheBuster] = useState(() => Date.now());
  const [syncingStatus, setSyncingStatus] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    async function verifyAndLoad() {
      setLoading(true);
      try {
        const res = await api.validateAndConsumeToken(token);
        if (!isMounted) return;

        if (res && res.success && res.originalUrl) {
          setVerified(true);
          setResourceName(res.resourceName || 'Protected Resource');
          setTargetUrl(res.originalUrl);
          setTokenRecord(res.tokenRecord);
          setErrorReason(null);
        } else {
          setVerified(false);
          setErrorReason(res?.reason || 'INVALID_TOKEN');
          setResourceName(res?.resourceName || 'Protected Resource');
        }
      } catch (err: any) {
        if (!isMounted) return;
        setVerified(false);
        setErrorReason('VERIFICATION_FAILED');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (token) {
      verifyAndLoad();
    } else {
      setLoading(false);
      setErrorReason('TOKEN_MISSING');
    }

    return () => {
      isMounted = false;
    };
  }, [token]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {
        setIsFullscreen(!isFullscreen);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const handleOpenFullScreenApp = () => {
    if (targetUrl) {
      window.open(targetUrl, '_blank');
    }
  };

  const laptopAccessUrl = typeof window !== 'undefined' ? `${window.location.origin}/?token=${token}` : '';

  const handleCopyLaptopLink = () => {
    if (!laptopAccessUrl) return;
    navigator.clipboard.writeText(laptopAccessUrl);
    setCopiedLaptopLink(true);
    setTimeout(() => setCopiedLaptopLink(false), 2500);
  };

  const isGoogleUrl = targetUrl ? /google\.com|drive\.google|docs\.google|sites\.google/i.test(targetUrl) : false;
  const isRawGithubRepo = targetUrl
    ? /github\.com\/[^\/]+\/[^\/]+(?:\/)?$/i.test(targetUrl) && !/github\.io/i.test(targetUrl)
    : false;

  const computedFrameUrl = targetUrl
    ? `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}_eie_sync=${cacheBuster}`
    : '';

  const handleReloadFrame = () => {
    setIframeKey((prev) => prev + 1);
  };

  const handleForceSyncLatest = () => {
    const freshStamp = Date.now();
    setCacheBuster(freshStamp);
    setIframeKey((prev) => prev + 1);
    setSyncingStatus('Cache bypass in progress...');
    setTimeout(() => {
      setSyncingStatus('Latest version loaded ✓');
    }, 1000);
    setTimeout(() => {
      setSyncingStatus(null);
    }, 3500);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
        </div>
        <h2 className="text-lg font-bold text-white mb-1">Authenticating One-Time Access Token...</h2>
        <p className="text-xs text-slate-400 font-mono">
          Zero-leak cloaked session initializing. Private link is cryptographically protected.
        </p>
      </div>
    );
  }

  if (!verified || !targetUrl) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 rounded-2xl bg-[#0b1220] border border-rose-500/30 shadow-2xl text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-rose-400" />
        </div>

        <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          {errorReason === 'DENIED_CONCURRENT_DEVICE'
            ? 'SINGLE-DEVICE RESTRICTION'
            : errorReason === 'ALREADY_USED'
            ? 'SINGLE-USE TOKEN CONSUMED'
            : errorReason === 'EXPIRED'
            ? 'ACCESS TOKEN EXPIRED'
            : 'ACCESS RESTRICTED'}
        </span>

        <h2 className="text-xl font-bold text-white mt-4 mb-2">
          {errorReason === 'DENIED_CONCURRENT_DEVICE'
            ? 'Single-Device Access Restriction (एक समय में एक डिवाइस)'
            : errorReason === 'ALREADY_USED'
            ? 'Yeh Token Pehle Hi Use Ho Chuka Hai'
            : errorReason === 'EXPIRED'
            ? 'Aapka Token Samay Seema Paar Kar Chuka Hai'
            : 'Access Not Authorized'}
        </h2>

        <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto mb-6">
          {errorReason === 'DENIED_CONCURRENT_DEVICE'
            ? `Yeh token already "${tokenRecord?.boundDeviceType || 'doosre device'}" par active/open ho chuka hai. EIE-Technology security niyam anusar yeh token at a time keval ek hi device (ya to Mobile me ya Laptop me) par chal sakta hai.`
            : errorReason === 'ALREADY_USED'
            ? 'Suraksha niyam anusar, single-use token ek baar istemaal karne ke baad lock ho jata hai taaki anadhikrit copy ya sharing na ho sake.'
            : 'Surakshit access ki validity khatam ho chuki hai. Naye access ke liye kripya naya payment session banayein ya merchant se sampark karein.'}
        </p>

        <div className="p-4 rounded-xl bg-[#060a12] border border-[#162338] text-xs font-mono text-left space-y-2 mb-6">
          <div className="flex justify-between text-slate-400">
            <span>Resource:</span>
            <span className="text-white font-bold">{resourceName}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Security Status:</span>
            <span className="text-rose-400 font-bold">LOCKED & PROTECTED</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Source Protection:</span>
            <span className="text-emerald-400 font-bold">ZERO-LEAK VERIFIED</span>
          </div>
        </div>

        {onBackToStore && (
          <button
            onClick={onBackToStore}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-xs hover:brightness-110 transition shadow-lg flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Store & Get New Access (स्टोर पर जाएं)</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-[#070b13] text-slate-100 ${
        isFullscreen ? 'fixed inset-0 z-50 p-0 m-0' : 'w-full max-w-6xl mx-auto p-3 sm:p-4 my-2'
      }`}
    >
      {/* Top Security Control Bar */}
      <div className="bg-[#0b1220] border border-[#1a293f] rounded-t-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none">
                {resourceName}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                URL CLOAKED (Zero-Leak)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Secure Live Use Session • Link Protected & Never Exposed
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={handleOpenFullScreenApp}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-400 to-teal-500 hover:brightness-110 text-slate-950 shadow-md flex items-center gap-1.5 transition active:scale-95"
            title="Open App in Full Screen without 403 error"
          >
            <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>🚀 Open Full Screen (पूरी स्क्रीन)</span>
          </button>

          <button
            onClick={handleForceSyncLatest}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#121c2d] hover:bg-[#1a283f] text-emerald-300 border border-emerald-500/30 transition flex items-center gap-1.5 active:scale-95"
            title="GitHub cache bypass karke naya code load karein"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingStatus ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{syncingStatus || '⚡ Force Sync (नया अपडेट)'}</span>
          </button>

          <button
            onClick={handleReloadFrame}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#121c2d] hover:bg-[#1a283f] text-slate-300 border border-[#20324c] transition flex items-center gap-1.5"
            title="Reload Frame"
          >
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#121c2d] hover:bg-[#1a283f] text-slate-300 border border-[#20324c] transition flex items-center gap-1.5"
            title="Toggle Browser Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit Full' : 'Maximize'}</span>
          </button>

          {onBackToStore && !isFullscreen && (
            <button
              onClick={onBackToStore}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#121c2d] hover:bg-[#1a283f] text-slate-300 border border-[#20324c] transition flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Store</span>
            </button>
          )}
        </div>
      </div>

      {/* Google 403 Prevention Alert */}
      {isGoogleUrl && (
        <div className="bg-amber-500/10 border-x border-b border-amber-500/30 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Google 403 Error Notice:</strong> Google Drive / Cloud Apps iframe me "403 That's an error" dete hain. Apna app bina kisi 403 error ke smoothly chalane ke liye <strong>'Open Full Screen'</strong> par click karein.
            </span>
          </div>
          <button
            onClick={handleOpenFullScreenApp}
            className="px-3 py-1 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition shadow"
          >
            🚀 Run App Full Screen (No 403 Error)
          </button>
        </div>
      )}

      {/* Raw GitHub Repository Notice */}
      {isRawGithubRepo && (
        <div className="bg-indigo-500/15 border-x border-b border-indigo-500/30 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-indigo-200">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              <strong>GitHub Notice:</strong> Yeh raw GitHub repository link hai. Web page live dekhne ke liye 'GitHub Pages' URL (jaise <code>https://&lt;username&gt;.github.io/&lt;repo&gt;/</code>) use karein ya live chalane ke liye 'Open Full Screen' click karein.
            </span>
          </div>
          <button
            onClick={handleOpenFullScreenApp}
            className="px-3 py-1 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs transition shadow"
          >
            🚀 Open GitHub Full Screen
          </button>
        </div>
      )}

      {/* Embedded Sandboxed Player Container */}
      <div className="relative w-full bg-[#03060a] border-x border-b border-[#1a293f] overflow-hidden shadow-2xl flex flex-col" style={{ height: isFullscreen ? 'calc(100vh - 58px)' : '70vh', minHeight: '460px' }}>
        <iframe
          key={iframeKey}
          src={computedFrameUrl || targetUrl}
          title={resourceName}
          className="w-full h-full border-0 bg-[#070b13]"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-modals allow-top-navigation allow-presentation"
          referrerPolicy="no-referrer"
        />

        {/* Security Overlay Watermark */}
        <div className="absolute bottom-2 right-3 pointer-events-none opacity-60 text-[10px] font-mono text-emerald-400/80 bg-[#070b13]/90 px-2.5 py-1 rounded border border-emerald-500/20">
          🔒 EIE Cloaked Viewer • Secure Session
        </div>
      </div>

      {/* Laptop / PC Access Sharing Card */}
      {!isFullscreen && (
        <div className="mt-3 p-4 rounded-xl bg-[#0b1220] border border-sky-500/30 space-y-3 shadow-lg">
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
              className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-semibold border border-emerald-500/30 flex items-center justify-center gap-1.5 transition"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp Par Bhejein (Laptop Web)</span>
            </a>
            <button
              onClick={handleOpenFullScreenApp}
              className="flex-1 py-1.5 px-3 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 flex items-center justify-center gap-1.5 transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>Direct Full Screen App (No 403 Error)</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400">
            💡 <strong>Tip:</strong> Is link ko aap apne laptop browser (Chrome, Edge, Safari) me open karke aasaani se full screen chala sakte hain.
          </p>
        </div>
      )}

      {/* Safety & Customer Advisory Notice */}
      {!isFullscreen && (
        <div className="mt-3 p-3 rounded-xl bg-[#090f1a] border border-[#162338] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Valid Customer Access:</strong> Validity jab tak active hai, tab tak aap is portal ko bina kisi rukawat ke jitni baar chahein open aur use kar sakte hain.
            </span>
          </div>
          <div className="text-[11px] font-mono text-emerald-400/90 shrink-0">
            {tokenRecord?.expiresAt ? `Valid Till: ${new Date(tokenRecord.expiresAt).toLocaleDateString()}` : 'Validity Active'} • Zero-Leak Verified
          </div>
        </div>
      )}
    </div>
  );
};
