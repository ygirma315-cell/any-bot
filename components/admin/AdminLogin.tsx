'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Lock, User, ShieldCheck, KeyRound, ArrowRight, Sparkles } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    if (username.trim() === 'admin' && password === 'admin123') {
      setError('');
      sessionStorage.setItem('ai_store_admin_authenticated', 'true');
      onLoginSuccess();
    } else {
      setError('Invalid username or password. (Default: admin / admin123)');
    }
  };

  const handleFillDemo = () => {
    setUsername('admin');
    setPassword('admin123');
    setError('');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-100 via-orange-50/40 to-amber-50 text-slate-900 relative overflow-y-auto">
      {/* Background Glowing Ambient Reflections */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-auto">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="relative w-16 h-16 mx-auto rounded-2xl bg-white p-1 border border-slate-200 shadow-md flex items-center justify-center">
            <Image
              src="/assets/buy_ai_store_logo.png"
              alt="AnyAi STORE Admin"
              width={60}
              height={60}
              className="object-cover w-full h-full rounded-xl"
            />
          </div>
          <div>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-50 text-orange-600 font-extrabold text-[11px] border border-orange-200/80 mb-1">
              <Sparkles className="w-3 h-3 text-orange-500" /> Admin Access
            </span>
            <h1 className="heading-font text-2xl font-black tracking-tight text-slate-900">
              ADMIN PORTAL
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              AnyAi STORE Management & Product Control Center
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-bold animate-fadeIn">
            {error}
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wide">
              Admin Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wide">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all shadow-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-xs rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all flex items-center justify-center gap-2 transform active:scale-95"
          >
            <span>Log In to Admin Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Quick Auto-Fill helper button */}
        <div className="pt-4 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={handleFillDemo}
            className="inline-flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 font-bold transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Auto-fill Demo Credentials (admin / admin123)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
