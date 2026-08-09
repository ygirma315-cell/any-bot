'use client';

import React from 'react';
import { Store, ShoppingBag, CreditCard } from 'lucide-react';
import { triggerHaptic } from '@/lib/telegram';

interface NavbarProps {
  activeTab: 'services' | 'order' | 'payment';
  setActiveTab: (tab: 'services' | 'order' | 'payment') => void;
  cartCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, cartCount }) => {
  const tabs = [
    { id: 'services', label: 'Services', icon: Store },
    { id: 'order', label: 'Order', icon: ShoppingBag, badge: cartCount },
    { id: 'payment', label: 'Payment', icon: CreditCard }
  ] as const;

  const handleTabClick = (tabId: 'services' | 'order' | 'payment') => {
    triggerHaptic('light');
    setActiveTab(tabId);
  };

  return (
    <nav className="sticky bottom-0 z-40 px-4 py-2.5 bg-white/90 backdrop-blur-xl border-t border-slate-100/90 shadow-lg">
      <div className="relative flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-4 min-w-[90px] rounded-2xl transition-all duration-300 ${
                isActive ? 'text-indigo-600 font-bold' : 'text-slate-500 font-medium hover:text-slate-800'
              }`}
            >
              {/* Active Indicator Backdrop Pill */}
              {isActive && (
                <div className="absolute inset-0 bg-indigo-50/90 rounded-2xl border border-indigo-100/80 shadow-xs transition-all duration-300 animate-fadeIn" />
              )}

              <div className="relative z-10 flex flex-col items-center">
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
                  
                  {/* Cart Count Badge */}
                  {tab.id === 'order' && tab.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-sm animate-bounce">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] tracking-tight mt-1">{tab.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
