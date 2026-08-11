'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, ShoppingBag, Wallet, Activity, Bot, ShieldCheck } from 'lucide-react';
import { triggerHaptic } from '@/lib/telegram';
import { getStoredOrders } from '@/lib/store';

interface NavbarProps {
  activeTab: 'services' | 'order' | 'payment' | 'status';
  setActiveTab: (tab: 'services' | 'order' | 'payment' | 'status') => void;
  cartCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, cartCount }) => {
  const [pendingCount, setPendingCount] = useState<number>(0);

  const checkPending = () => {
    const orders = getStoredOrders();
    const count = orders.filter(o => o.status === 'Pending' || o.status === 'Payment Submitted').length;
    setPendingCount(count);
  };

  useEffect(() => {
    checkPending();
    const handleUpdate = () => checkPending();
    window.addEventListener('ai_store_orders_updated', handleUpdate);
    return () => window.removeEventListener('ai_store_orders_updated', handleUpdate);
  }, []);

  interface NavTab {
    id: 'services' | 'order' | 'payment' | 'status';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    gradient: string;
    badge?: number;
  }

  const tabs: NavTab[] = [
    {
      id: 'services',
      label: 'Services',
      icon: Bot,
      gradient: 'from-blue-600 to-cyan-500'
    },
    {
      id: 'order',
      label: 'Order',
      icon: ShoppingBag,
      gradient: 'from-[#FF6B00] to-amber-500',
      badge: cartCount
    },
    {
      id: 'payment',
      label: 'Payment',
      icon: Wallet,
      gradient: 'from-emerald-600 to-teal-500'
    },
    {
      id: 'status',
      label: 'Status',
      icon: Activity,
      gradient: 'from-purple-600 to-indigo-600',
      badge: pendingCount
    }
  ];

  const handleTabClick = (tabId: 'services' | 'order' | 'payment' | 'status') => {
    triggerHaptic('light');
    setActiveTab(tabId);
  };

  return (
    <nav className="relative z-30 shrink-0 w-full px-3 py-2 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] select-none touch-none overscroll-none">
      <div className="relative flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id as 'services' | 'order' | 'payment' | 'status')}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-300 ${
                isActive ? 'scale-105' : 'opacity-70 hover:opacity-100'
              }`}
            >
              {/* Active Indicator Glow Background */}
              {isActive && (
                <div className="absolute inset-0 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-xs transition-all duration-300 animate-fadeIn" />
              )}

              <div className="relative z-10 flex flex-col items-center gap-1">
                <div className="relative">
                  {/* High-Vibe Icon Tile */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm ${
                      isActive
                        ? `bg-gradient-to-tr ${tab.gradient} text-white shadow-md scale-110`
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4 stroke-[2.2]" />
                  </div>

                  {/* Badge count */}
                  {tab.badge && tab.badge > 0 ? (
                    <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[9.5px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-md animate-bounce">
                      {tab.badge}
                    </span>
                  ) : null}
                </div>

                <span className={`text-[10.5px] font-extrabold tracking-tight transition-colors ${
                  isActive ? 'text-slate-900' : 'text-slate-500'
                }`}>
                  {tab.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
