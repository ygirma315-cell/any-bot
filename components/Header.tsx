'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { getTelegramUser, TelegramUser } from '@/lib/telegram';

export const Header: React.FC = () => {
  const [userData, setUserData] = useState<{ user: TelegramUser; isFallback: boolean } | null>(null);

  useEffect(() => {
    const data = getTelegramUser();
    setUserData(data);
  }, []);

  const displayName = userData?.user.username
    ? `@${userData.user.username}`
    : userData?.user.first_name || 'Customer';

  return (
    <header className="sticky top-0 z-30 px-5 pt-4 pb-3 bg-white/85 backdrop-blur-md border-b border-slate-200/60 shadow-xs transition-all">
      <div className="flex items-center justify-between gap-2">
        {/* Store Title */}
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-[1.5px] shadow-sm flex items-center justify-center">
            <div className="w-full h-full bg-white rounded-[10.5px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div>
            <h1 className="heading-font text-lg font-bold tracking-tight text-slate-900 leading-none">
              AI STORE
            </h1>
            <p className="text-[11px] font-medium text-slate-500 tracking-wide mt-0.5">
              Premium Digital & AI Services
            </p>
          </div>
        </div>

        {/* User Badge (Replaced Browser Mode text with User Name) */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 border border-slate-200/80 shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-bold text-slate-800 truncate max-w-[130px]">
            {displayName}
          </span>
        </div>
      </div>

      {/* Verification Sub-header */}
      <div className="flex items-center justify-between text-xs text-slate-600 mt-2.5 pt-2 border-t border-slate-200/50">
        <span className="text-[11px] font-medium text-slate-500">
          ✨ Instant Delivery Guarantee
        </span>
        <span className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50/90 px-2 py-0.5 rounded-md font-semibold border border-emerald-200/60">
          <ShieldCheck className="w-3.5 h-3.5" /> Verified Shop
        </span>
      </div>
    </header>
  );
};
