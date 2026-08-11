'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface LoadingScreenProps {
  onComplete?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState<number>(0);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [isHidden, setIsHidden] = useState<boolean>(false);

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
        const next = prev + Math.floor(Math.random() * 18 + 12);
        return next > 100 ? 100 : next;
      });
    }, 120);

    return () => {
      clearInterval(timer);
    };
  }, [onComplete]);

  if (isHidden) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-[#0B0F19] to-slate-950 text-white transition-opacity duration-700 p-6 select-none overflow-hidden ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* High-Energy Multi-Glow RGB Backdrop */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-tr from-[#FF6B00]/40 via-amber-500/30 to-orange-400/20 blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-tr from-indigo-600/40 via-purple-600/30 to-pink-500/20 blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-pink-500/20 blur-3xl pointer-events-none" />

      {/* Main Content Shell */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-7 max-w-xs w-full">
        
        {/* Logo Container with Smooth Concentric Animated Spinning Circles */}
        <div className="relative w-44 h-44 flex items-center justify-center">
          {/* Outer Smooth Spinning Circle Ring 1 */}
          <div className="absolute inset-0 rounded-full border-2 border-[#FF6B00]/40 border-t-[#FF6B00] border-r-[#FF6B00]/80 animate-spin duration-1500" />
          
          {/* Inner Counter-Spinning Circle Ring 2 */}
          <div className="absolute inset-2.5 rounded-full border-2 border-indigo-500/40 border-b-indigo-400 border-l-purple-500 animate-spin-reverse duration-2000" />

          {/* Pulsing Glow Ring 3 */}
          <div className="absolute inset-5 rounded-full border border-orange-400/30 animate-ping opacity-40" />

          {/* Logo Center Card */}
          <div className="relative w-24 h-24 rounded-2xl bg-white p-2.5 border border-slate-200/90 shadow-[0_0_35px_rgba(255,107,0,0.35)] flex items-center justify-center overflow-hidden z-10">
            <Image
              src="/assets/buy_ai_store_logo.png"
              alt="AnyAi Store Logo"
              width={84}
              height={84}
              className="object-contain w-full h-full rounded-xl"
              priority
            />
          </div>
        </div>

        {/* Minimalist Smooth Progress Bar (No Text) */}
        <div className="w-52 pt-1">
          <div className="w-full h-1.5 bg-slate-900/90 rounded-full p-0.5 border border-slate-700/80 overflow-hidden shadow-inner backdrop-blur-md">
            <div
              className="h-full bg-gradient-to-r from-[#FF6B00] via-amber-400 to-indigo-500 rounded-full transition-all duration-200 ease-out shadow-[0_0_12px_rgba(255,107,0,0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

