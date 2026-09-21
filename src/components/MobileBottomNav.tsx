import React from 'react';
import { Layers, Lock, CreditCard, KeyRound, ShieldAlert, Settings, Plus } from 'lucide-react';
import type { ActiveTab } from './Header';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenNewResource: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenNewResource,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: Layers },
    { id: 'resources', label: 'Resources', icon: Lock },
    { id: 'transactions', label: 'Payments', icon: CreditCard },
    { id: 'tokens', label: 'Tokens', icon: KeyRound },
    { id: 'security', label: 'Security', icon: ShieldAlert },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <>
      {/* Floating Action Button (FAB) for One-Hand Resource / Payment Link Creation */}
      <div className="lg:hidden fixed bottom-20 right-4 z-40">
        <button
          onClick={onOpenNewResource}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 flex items-center justify-center shadow-2xl shadow-emerald-500/40 border-2 border-emerald-400 active:scale-90 transition hover:brightness-110"
          title="Create New Protected Resource or Payment Link"
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>
      </div>

      {/* Safe-area Aware Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#070b14]/95 backdrop-blur-lg border-t border-[#18263a] pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-6 h-16 items-center px-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id as ActiveTab)}
                className={`flex flex-col items-center justify-center h-full py-1 transition relative ${
                  isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 w-8 h-0.5 rounded-full bg-emerald-400" />
                )}
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="text-[10px] font-medium mt-1 truncate max-w-full px-0.5">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
