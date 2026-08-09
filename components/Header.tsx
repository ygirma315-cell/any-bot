'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { getTelegramUser, TelegramUser } from '@/lib/telegram';

export const Header: React.FC = () => {
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

  return (
    <header className="relative z-30 shrink-0 w-full px-5 py-3.5 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-xs transition-all">
      <div className="flex items-center justify-between gap-2">
        {/* Store Title & Composite AI Brand Emblem (ChatGPT + Gemini + Claude + Perplexity) */}
        <div className="flex items-center gap-2.5">
          {/* Composite AI Brand Logo Badge */}
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-[1.5px] shadow-sm flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-white rounded-[10.5px] p-0.5 grid grid-cols-2 gap-0.5 overflow-hidden">
              <Image src="/assets/products/chatgpt.png" alt="ChatGPT" width={18} height={18} className="object-contain w-full h-full rounded-xs" />
              <Image src="/assets/products/gemini.jpg" alt="Gemini" width={18} height={18} className="object-contain w-full h-full rounded-xs" />
              <Image src="/assets/products/claude.png" alt="Claude" width={18} height={18} className="object-contain w-full h-full rounded-xs" />
              <Image src="/assets/products/perplexity.svg" alt="Perplexity" width={18} height={18} className="object-contain w-full h-full rounded-xs" />
            </div>
          </div>

          <div>
            <h1 className="heading-font text-lg font-extrabold tracking-tight text-slate-900 leading-none">
              BUY AI STORE
            </h1>
            <p className="text-[11px] font-semibold text-indigo-600 tracking-wide mt-0.5">
              Premium Digital & AI Subscriptions
            </p>
          </div>
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-bold text-slate-800 truncate max-w-[120px]">
            {displayName}
          </span>
        </div>
      </div>
    </header>
  );
};
