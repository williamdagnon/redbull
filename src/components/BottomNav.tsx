import React from 'react';
import { BarChart3, Crown, Wallet, Users, Settings } from 'lucide-react';

type TabKey = 'overview' | 'vip' | 'wallet' | 'team' | 'history' | 'support' | 'deposit' | 'withdrawal' | 'transactions' | 'vip-purchases' | 'settings';

interface BottomNavProps {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChange }) => {
  const items = [
    { key: 'overview', icon: BarChart3, label: 'Tableau' },
    { key: 'vip', icon: Crown, label: 'VIP' },
    { key: 'wallet', icon: Wallet, label: 'Portefeuille' },
    { key: 'team', icon: Users, label: 'Équipe' },
    { key: 'settings', icon: Settings, label: 'Paramètres' },
  ];

  return (
    <>
      {/* Spacer pour éviter le chevauchement du contenu */}
      <div className="h-20 sm:h-24 md:hidden" />
      
      {/* BottomNav Mobile/Tablette */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-t border-gray-200 dark:border-slate-700" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        <div className="max-w-7xl mx-auto px-2 xs:px-4 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-1">
          {items.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => onChange(key as TabKey)}
              className={`flex-1 py-2.5 xs:py-3 px-1.5 xs:px-2.5 rounded-lg xs:rounded-xl flex flex-col xs:flex-row items-center justify-center gap-0.5 xs:gap-1.5 transition-all duration-300 text-xs xs:text-sm font-medium min-h-[52px] ${
                activeTab === key 
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg scale-105' 
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700/50 active:scale-95'
              }`}
              aria-label={label}
              title={label}
            >
              <Icon className="w-4.5 xs:w-5 h-4.5 xs:h-5 sm:w-6 sm:h-6 flex-shrink-0" />
              <span className="hidden xs:inline leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
};
