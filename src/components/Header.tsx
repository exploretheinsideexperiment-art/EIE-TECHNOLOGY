import React from 'react';
import {
  ShieldCheck,
  Lock,
  Layers,
  CreditCard,
  QrCode,
  KeyRound,
  Users,
  ShieldAlert,
  Settings,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export type ActiveTab =
  | 'dashboard'
  | 'resources'
  | 'pay_customer'
  | 'use_portal'
  | 'qr_manager'
  | 'transactions'
  | 'tokens'
  | 'customers'
  | 'security'
  | 'settings';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenNewResource: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenNewResource,
}) => {
  const navItems: Array<{ id: ActiveTab; label: string; icon: any; highlight?: boolean }> = [
    { id: 'dashboard', label: 'Dashboard', icon: Layers },
    { id: 'resources', label: 'My Resources', icon: Lock },
    { id: 'pay_customer', label: 'Customer Pay Page', icon: CreditCard, highlight: true },
    { id: 'qr_manager', label: 'QR Payments', icon: QrCode },
    { id: 'transactions', label: 'Transactions', icon: CreditCard },
    { id: 'tokens', label: 'Tokens', icon: KeyRound },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'security', label: 'Security Center', icon: ShieldAlert },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1c293d] bg-[#090d16]/95 backdrop-blur-md">
      {/* Top micro-bar for security compliance indicators */}
      <div className="hidden sm:flex items-center justify-between px-4 lg:px-8 py-1 text-[11px] font-mono border-b border-[#141e2e] bg-[#060910] text-slate-400">
        <div className="flex items-center space-x-4">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            ZERO-LEAK ACCESS SHIELD ACTIVE
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">HMAC-SHA256 WEBHOOK ENGINE</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">CSPRNG 256-BIT TOKEN DISPATCH</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-slate-400">HOST: pay.eie-technology.com</span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
            PRODUCTION READY
          </span>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Brand Identity */}
          <div
            onClick={() => onTabChange('dashboard')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-sky-500/20 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-900/30 group-hover:border-emerald-400 transition">
              <ShieldCheck className="w-6 h-6 text-emerald-400 group-hover:scale-105 transition" />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center">
                <Lock className="w-2 h-2 text-slate-950 stroke-[3]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white font-sans">
                  EIE-Technology
                </span>
                <span className="hidden md:inline-block px-2 py-0.5 text-[10px] font-mono font-semibold rounded-md bg-[#16253b] text-emerald-400 border border-[#213859]">
                  v2.4 SECURE
                </span>
              </div>
              <p className="text-[11px] font-medium text-emerald-400/90 tracking-wide leading-tight">
                Explore the Inside Experiment-Technology
              </p>
              <p className="text-[10px] text-slate-400 font-mono leading-tight">
                (Created by Vipul)
              </p>
            </div>
          </div>

          {/* Action CTAs & PWA Install */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => onTabChange('pay_customer')}
              className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition active:scale-95 shadow-sm"
              title="Open customer-facing payment simulation"
            >
              <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              <span className="hidden xs:inline">Customer</span> Pay Page
            </button>

            <button
              onClick={onOpenNewResource}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 hover:from-emerald-400 hover:to-teal-500 transition shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Resource</span>
            </button>

            <PWAInstallButton compact />
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-1 py-2 overflow-x-auto scrollbar-none border-t border-[#141e2e]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id as ActiveTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-[#152338] text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#101a2b]'
                } ${item.highlight && !isActive ? 'text-emerald-400 hover:text-emerald-300' : ''}`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.highlight && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
