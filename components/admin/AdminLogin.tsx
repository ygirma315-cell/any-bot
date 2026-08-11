'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

import { getStoredAdminPassword, fetchAdminPasswordFromSupabase } from '@/lib/store';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchAdminPasswordFromSupabase().catch(() => {});
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    const currentPassword = getStoredAdminPassword();

    if (username.trim().toLowerCase() === 'admin' && password === currentPassword) {
      setError('');
      sessionStorage.setItem('ai_store_admin_authenticated', 'true');
      onLoginSuccess();
    } else {
      setError(`Invalid username or password.`);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#F6F8FB] text-slate-900 overflow-y-auto font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl p-7 sm:p-8 shadow-[0_2px_12px_rgba(15,23,42,0.04)] space-y-6 my-auto">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="relative w-14 h-14 mx-auto rounded-xl bg-slate-50 p-1 border border-slate-200/80 shadow-xs flex items-center justify-center">
            <Image
              src="/assets/buy_ai_store_logo.png"
              alt="AnyAi STORE Admin"
              width={52}
              height={52}
              className="object-cover w-full h-full rounded-lg"
            />
          </div>
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-50 text-[#FF6B00] border border-orange-100 font-extrabold text-[10.5px] uppercase tracking-wider mb-1.5">
              <ShieldCheck className="w-3 h-3 text-[#FF6B00]" /> Admin Portal
            </span>
            <h1 className="heading-font text-xl font-extrabold tracking-tight text-slate-900">
              AnyAi STORE Control Center
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Log in to manage products, categories, pricing, and orders
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs text-center font-semibold animate-fadeIn">
            {error}
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
              Admin Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20 transition-all shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20 transition-all shadow-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>Log In to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
