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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white transition-opacity duration-700 p-6 select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Ambient Glowing Orbs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-gradient-to-tr from-cyan-500/20 via-blue-600/30 to-purple-600/20 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-orange-500/20 blur-3xl pointer-events-none" />

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-xs w-full">
        
        {/* Logo Container with Orbit Glow */}
        <div className="relative group">
          {/* Rotating RGB Border Orbit */}
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 blur-sm opacity-80 animate-spin duration-10000" />
          
          <div className="relative w-24 h-24 rounded-2xl bg-white p-2 border-2 border-white/20 shadow-2xl flex items-center justify-center overflow-hidden">
            <Image
              src="/assets/buy_ai_store_logo.png"
              alt="AnyAi Store Logo"
              width={88}
              height={88}
              className="object-contain w-full h-full rounded-xl"
              priority
            />
          </div>

          <Sparkles className="w-5 h-5 text-cyan-400 absolute -top-2 -right-2 animate-bounce" />
        </div>

        {/* Brand Title & Tagline */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-extrabold text-cyan-300 backdrop-blur-md">
            <Bot className="w-3.5 h-3.5 text-cyan-400" />
            <span>ANY AI STORE</span>
          </div>
          <h1 className="heading-font text-xl font-black text-white tracking-tight pt-1">
            ALL AI. ANY TASK. ONE PLACE.
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Premium AI Subscriptions & Instant Digital Delivery
          </p>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full space-y-2 pt-2">
          <div className="w-full h-2.5 bg-slate-800/90 rounded-full p-0.5 border border-white/10 overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-[#FF6B00] rounded-full transition-all duration-200 shadow-[0_0_12px_rgba(6,182,212,0.6)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
            <span className="text-cyan-400 font-semibold animate-fadeIn min-h-[16px] truncate">
              {loadingMessages[loadingTextIndex]}
            </span>
            <span className="font-mono text-white">{progress}%</span>
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
