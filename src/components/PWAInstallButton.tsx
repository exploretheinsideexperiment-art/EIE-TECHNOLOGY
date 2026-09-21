import React, { useState } from 'react';
import { Download, Share, Smartphone, Monitor, X, Check, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [activeTab, setActiveTab] = useState<'mobile' | 'pc' | 'ios'>(isIOS ? 'ios' : 'mobile');

  // If already running as an installed standalone PWA, hide the button
  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <Check className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Installed</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`flex items-center gap-2 rounded-xl font-bold transition active:scale-95 cursor-pointer ${
          isInstallable
            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500'
            : 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
        } ${compact ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-xs sm:text-sm'}`}
        title="Install EIE-Technology app on Mobile or PC"
      >
        <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-inherit" />
        <span>Install App</span>
      </button>

      {/* Comprehensive Install Guide Modal for Mobile & PC */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-[#0c1422] border border-[#1e2f47] p-5 sm:p-6 shadow-2xl relative text-left my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowGuide(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-5 pr-8">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight">
                  Install EIE-Technology
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Fast standalone app on Mobile & PC (Offline Ready)
                </p>
              </div>
            </div>

            {/* Platform Selector Tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#070b13] rounded-xl border border-[#162338] mb-4">
              <button
                onClick={() => setActiveTab('mobile')}
                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition ${
                  activeTab === 'mobile'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android</span>
              </button>
              <button
                onClick={() => setActiveTab('pc')}
                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition ${
                  activeTab === 'pc'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>PC / Laptop</span>
              </button>
              <button
                onClick={() => setActiveTab('ios')}
                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition ${
                  activeTab === 'ios'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>iPhone/iPad</span>
              </button>
            </div>

            {/* Guide Body */}
            {activeTab === 'mobile' && (
              <div className="space-y-3 text-xs sm:text-sm text-slate-300">
                {isInstallable && (
                  <button
                    onClick={async () => {
                      await install();
                      setShowGuide(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition mb-2 active:scale-98"
                  >
                    <Download className="w-4 h-4" />
                    <span>Launch 1-Tap Install Prompt</span>
                  </button>
                )}

                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#090d16] border border-[#162338]">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold font-mono">
                    1
                  </div>
                  <div>
                    Open in <strong>Google Chrome</strong> or <strong>Samsung Internet</strong> on your phone.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#090d16] border border-[#162338]">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold font-mono">
                    2
                  </div>
                  <div>
                    Tap the <strong>three dots (⋮)</strong> menu in the top-right corner of Chrome.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#090d16] border border-[#162338]">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold font-mono">
                    3
                  </div>
                  <div>
                    Tap <strong className="text-emerald-300">"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#090d16] border border-[#162338]">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold font-mono">
                    4
                  </div>
                  <div>
                    Confirm <strong>Install</strong>. EIE-Technology icon will appear on your phone home screen!
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'pc' && (
              <div className="space-y-3 text-xs sm:text-sm text-slate-300">
                {isInstallable && (
                  <button
                    onClick={async () => {
                      await install();
                      setShowGuide(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition mb-2 active:scale-98"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install to PC Desktop</span>
                  </button>
                )}

                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#090d16] border border-[#162338]">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold font-mono">
                    1
                  </div>
                  <div>
                    In <strong>Chrome</strong> or <strong>Edge</strong> on PC, look at the right side of the address bar.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#090d16] border border-[#162338]">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold font-mono">
                    2
                  </div>
                  <div>
                    Click the <strong className="text-emerald-300">Install icon</strong> (a computer monitor with a downward arrow) in the address bar.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#090d16] border border-[#162338]">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold font-mono">
                    3
                  </div>
                  <div>
                    Or click browser menu <strong>(⋮) &gt; "Save and share" &gt; "Install EIE-Technology"</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#090d16] border border-[#162338]">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold font-mono">
                    4
                  </div>
                  <div>
                    The app will open in its own clean desktop window with a desktop shortcut!
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ios' && (
              <div className="space-y-3 text-xs sm:text-sm text-slate-300">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#090d16] border border-[#162338]">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold font-mono">
                    1
                  </div>
                  <div>
                    Open in Safari on iPhone or iPad and tap the <strong className="text-white inline-flex items-center gap-1">Share <Share className="w-3.5 h-3.5 text-sky-400" /></strong> button.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#090d16] border border-[#162338]">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold font-mono">
                    2
                  </div>
                  <div>
                    Scroll down the sharing sheet and tap <strong className="text-emerald-300">"Add to Home Screen"</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#090d16] border border-[#162338]">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold font-mono">
                    3
                  </div>
                  <div>
                    Tap <strong>Add</strong> in the top-right corner to launch full-screen.
                  </div>
                </div>
              </div>
            )}

            {/* Dismiss Button */}
            <button
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full rounded-xl bg-[#17253b] hover:bg-[#1f3250] py-2.5 text-xs sm:text-sm font-semibold text-slate-200 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
