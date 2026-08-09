'use client';

import React, { useState, useEffect } from 'react';
import { Store, ShoppingBag, CreditCard, Clock } from 'lucide-react';
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
    badge?: number;
  }

  const tabs: NavTab[] = [
    { id: 'services', label: 'Services', icon: Store },
    { id: 'order', label: 'Order', icon: ShoppingBag, badge: cartCount },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'status', label: 'Status', icon: Clock, badge: pendingCount }
  ];

  const handleTabClick = (tabId: 'services' | 'order' | 'payment' | 'status') => {
    triggerHaptic('light');
    setActiveTab(tabId);
  };

  return (
    <nav className="relative z-30 shrink-0 w-full px-3 py-2 bg-white/90 backdrop-blur-xl border-t border-slate-200/70 shadow-lg">
      <div className="relative flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id as 'services' | 'order' | 'payment' | 'status')}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-300 ${
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
                  
                  {/* Badge count */}
                  {tab.badge && tab.badge > 0 ? (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-sm animate-pulse">
                      {tab.badge}
                    </span>
                  ) : null}
                </div>
                <span className="text-[10.5px] tracking-tight mt-1">{tab.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
