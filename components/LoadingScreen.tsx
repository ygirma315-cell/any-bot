'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Sparkles, Bot, ShieldCheck } from 'lucide-react';

interface LoadingScreenProps {
  onComplete?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState<number>(0);
  const [loadingTextIndex, setLoadingTextIndex] = useState<number>(0);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [isHidden, setIsHidden] = useState<boolean>(false);

  const loadingMessages = [
    'Initializing AnyAi Store...',
    'Loading Premium AI Assistants & Services...',
    'Connecting Secure Telegram Environment...',
    'Welcome to AnyAi Store!'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsFadingOut(true);
          setTimeout(() => {
            setIsHidden(true);
            if (onComplete) onComplete();
          }, 600);
          return 100;
        }
        // Increment progress smoothly
        const next = prev + Math.floor(Math.random() * 15 + 10);
        return next > 100 ? 100 : next;
      });
    }, 180);

    const messageTimer = setInterval(() => {
      setLoadingTextIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 500);

    return () => {
      clearInterval(timer);
      clearInterval(messageTimer);
    };
  }, [onComplete]);

  if (isHidden) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 text-white transition-opacity duration-700 p-6 select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-[#FF6B00]/10 blur-3xl pointer-events-none" />

      {/* Main Content Shell */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-xs w-full">
        
        {/* Logo Container with Smooth Concentric Animated Spinning Rings */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          {/* Outer Smooth Spinning Circle Ring 1 */}
          <div className="absolute inset-0 rounded-full border-2 border-[#FF6B00]/20 border-t-[#FF6B00] animate-spin duration-1500" />
          
          {/* Inner Counter-Spinning Circle Ring 2 */}
          <div className="absolute inset-2 rounded-full border-2 border-indigo-500/20 border-b-indigo-500 animate-spin-reverse duration-2000" />

          {/* Pulsing Subtle Glow Ring 3 */}
          <div className="absolute inset-4 rounded-full border border-white/10 animate-ping opacity-25" />

          {/* Logo Center Card */}
          <div className="relative w-20 h-20 rounded-2xl bg-white p-2 border border-slate-200 shadow-xl flex items-center justify-center overflow-hidden z-10">
            <Image
              src="/assets/buy_ai_store_logo.png"
              alt="AnyAi Store Logo"
              width={72}
              height={72}
              className="object-contain w-full h-full rounded-xl"
              priority
            />
          </div>
        </div>

        {/* Brand Title & Tagline */}
        <div className="space-y-1">
          <h1 className="heading-font text-lg font-black text-white tracking-tight">
            AnyAi STORE
          </h1>
          <p className="text-[11px] text-slate-400 font-semibold tracking-wide">
            ALL AI. ANY TASK. ONE PLACE.
          </p>
        </div>

        {/* Minimalist Clean Progress Bar */}
        <div className="w-full space-y-2 pt-1">
          <div className="w-full h-1.5 bg-slate-800 rounded-full p-0.5 border border-slate-700/60 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FF6B00] to-indigo-500 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
            <span className="text-orange-400 font-semibold truncate animate-fadeIn">
              {loadingMessages[loadingTextIndex]}
            </span>
            <span className="font-mono text-slate-300">{progress}%</span>
          </div>
        </div>

        {/* Security Badge */}
        <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Verified Telegram Mini App</span>
        </div>
      </div>
    </div>
  );
};
