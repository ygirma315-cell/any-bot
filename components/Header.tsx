'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { getTelegramUser, TelegramUser, triggerHaptic } from '@/lib/telegram';
import { User, MessageCircle } from 'lucide-react';

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
    <header className="relative z-30 shrink-0 w-full px-4 py-3 bg-white/85 backdrop-blur-xl border-b border-slate-200/60 shadow-xs transition-all select-none touch-none overscroll-none">
      <div className="flex items-center justify-between gap-2">
        {/* BUY AI STORE Header Title & Custom Unified AI Emblem Logo */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-sm border border-slate-200/80 bg-white flex items-center justify-center p-0.5 shrink-0">
            <Image
              src="/assets/buy_ai_store_logo.png"
              alt="AnyAi STORE Logo"
              width={40}
              height={40}
              className="object-cover w-full h-full rounded-lg"
            />
          </div>

          <div>
            <h1 className="heading-font text-lg font-extrabold tracking-tight text-slate-900 leading-none">
              AnyAi STORE
            </h1>
            <p className="text-[11px] font-semibold text-indigo-600 tracking-wide mt-0.5">
              Premium Digital & AI Subscriptions
            </p>
          </div>
        </div>

        {/* Circular Clickable Customer / User Badge Pill */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            if (onOpenContact) onOpenContact();
          }}
          className="flex items-center gap-1.5 p-1 pr-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white border border-slate-700/80 hover:border-[#FF6B00] shadow-md transition-all transform active:scale-95 group"
          title="Click for Support & Contacts"
        >
          {/* Outer Circle Avatar */}
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#FF6B00] to-indigo-500 flex items-center justify-center text-[10px] font-black text-white shadow-xs shrink-0 relative">
            <span>{firstLetter}</span>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-slate-900" />
          </div>

          <span className="text-[11px] font-extrabold text-slate-100 truncate max-w-[100px] group-hover:text-orange-300 transition-colors">
            {displayName}
          </span>
          <MessageCircle className="w-3.5 h-3.5 text-orange-400 opacity-80 group-hover:opacity-100 shrink-0" />
        </button>
      </div>
    </header>
  );
};

