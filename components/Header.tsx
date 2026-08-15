'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { getTelegramUser, TelegramUser, triggerHaptic } from '@/lib/telegram';
import { Headphones, MessageCircle } from 'lucide-react';

interface HeaderProps {
  onOpenContact?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenContact }) => {
  const [user, setUser] = useState<TelegramUser>({
    id: 30685155,
    first_name: 'Customer',
    username: 'customer'
  });

  useEffect(() => {
    const telegramData = getTelegramUser();
    if (!telegramData.isFallback && telegramData.user?.first_name) {
      setUser(telegramData.user);
      return;
    }

    fetch('/api/telegram/user')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const displayName = user.username
    ? `@${user.username}`
    : `${user.first_name} ${user.last_name || ''}`.trim() || 'Customer';

  const firstLetter = (user.username || user.first_name || 'C').charAt(0).toUpperCase();

  return (
    <header className="relative z-30 shrink-0 w-full px-4 sm:px-6 lg:px-8 py-3 bg-white/90 backdrop-blur-xl border-b border-slate-200/70 shadow-xs transition-all select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* BUY AI STORE Header Title & Custom Unified AI Emblem Logo */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-sm border border-slate-200/80 bg-white flex items-center justify-center p-0.5 shrink-0">
            <Image
              src="/assets/buy_ai_store_logo.png"
              alt="AnyAi STORE Logo"
              width={36}
              height={36}
              className="object-cover w-full h-full rounded-lg"
            />
          </div>

          <div>
            <h1 className="heading-font text-base sm:text-lg font-extrabold tracking-tight text-slate-900 leading-none">
              AnyAi STORE
            </h1>
            <p className="text-[10.5px] font-bold text-indigo-600 tracking-tight mt-0.5">
              Digital &amp; AI Services
            </p>
          </div>
        </div>

        {/* Right Action Shell: Customer User Badge + Dedicated Contact Us Button */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Customer User Badge Pill */}
          <div className="px-3 py-1.5 rounded-full bg-slate-100/90 border border-slate-200/90 shadow-xs flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-slate-800 truncate max-w-[130px]">
              {displayName}
            </span>
          </div>

          {/* Dedicated Contact Us Button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              if (onOpenContact) onOpenContact();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#FF6B00] via-orange-500 to-amber-500 hover:from-[#E66000] hover:to-orange-600 text-white text-xs font-extrabold shadow-sm hover:shadow-md transition-all active:scale-95 shrink-0"
            title="Open Support & Contact Channels"
          >
            <Headphones className="w-3.5 h-3.5 text-white stroke-[2.5]" />
            <span className="tracking-tight hidden sm:inline">Contact Us</span>
            <span className="tracking-tight sm:hidden">Support</span>
          </button>
        </div>
      </div>
    </header>
  );
};

