'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { getTelegramUser, TelegramUser } from '@/lib/telegram';

export const Header: React.FC = () => {
  const [user, setUser] = useState<TelegramUser>({
    id: 30685155,
    first_name: 'Customer',
    username: 'customer'
  });

  useEffect(() => {
    // 1. First check if running inside Telegram WebApp SDK
    const telegramData = getTelegramUser();
    if (!telegramData.isFallback && telegramData.user?.first_name) {
      setUser(telegramData.user);
      return;
    }

    // 2. Otherwise fetch real Telegram user details via Bot API getChat endpoint
    fetch('/api/telegram/user')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {
        // keep default fallback
      });
  }, []);

  const displayName = user.username
    ? `@${user.username}`
    : `${user.first_name} ${user.last_name || ''}`.trim() || 'Customer';

  return (
    <header className="relative z-30 shrink-0 w-full px-5 py-3.5 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-xs transition-all">
      <div className="flex items-center justify-between gap-2">
        {/* Store Title */}
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-[1.5px] shadow-sm flex items-center justify-center animate-pulse">
            <div className="w-full h-full bg-white/90 rounded-[10.5px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div>
            <h1 className="heading-font text-lg font-extrabold tracking-tight text-slate-900 leading-none">
              AI STORE
            </h1>
            <p className="text-[11px] font-semibold text-indigo-600 tracking-wide mt-0.5">
              Premium Digital & AI Services
            </p>
          </div>
        </div>

        {/* Live User Badge (Real Telegram Username fetched via Bot API) */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-bold text-slate-800 truncate max-w-[130px]">
            {displayName}
          </span>
        </div>
      </div>
    </header>
  );
};
