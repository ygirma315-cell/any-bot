'use client';

import React from 'react';
import { X, Send, Code, Store, ShieldCheck, MessageCircle } from 'lucide-react';
import { triggerHaptic } from '@/lib/telegram';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn select-none">
      <div 
        className="w-full max-w-sm bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xl space-y-5 relative overflow-hidden transform transition-all scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6B00]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#FF6B00] to-indigo-600 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
            </div>
            <div>
              <h3 className="heading-font text-base font-extrabold text-slate-900">
                Contact & Support
              </h3>
              <p className="text-[11px] font-semibold text-slate-500">
                Direct Telegram Contacts
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Contact Options List */}
        <div className="space-y-3 relative z-10">
          
          {/* Seller / Product Support Contact Card */}
          <a
            href="https://t.me/exo80"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => triggerHaptic('medium')}
            className="group p-4 bg-gradient-to-r from-orange-50/80 to-amber-50/60 hover:from-orange-100/90 hover:to-amber-100/80 rounded-2xl border border-orange-200/80 transition-all flex items-center justify-between shadow-xs hover:shadow-md block"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#FF6B00] to-amber-500 text-white flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                <Store className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="heading-font text-xs font-extrabold text-slate-900">
                    Product & Seller Support
                  </h4>
                  <span className="text-[9.5px] font-black text-white bg-[#FF6B00] px-1.5 py-0.5 rounded-full">
                    SELLER
                  </span>
                </div>
                <p className="text-[11px] font-bold text-orange-600 mt-0.5">
                  @exo80
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  For product orders, warranty & service help
                </p>
              </div>
            </div>
            <Send className="w-4 h-4 text-[#FF6B00] group-hover:translate-x-1 transition-transform shrink-0" />
          </a>

          {/* Developer Contact Card */}
          <a
            href="https://t.me/grpbuyer3"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => triggerHaptic('medium')}
            className="group p-4 bg-gradient-to-r from-indigo-50/80 to-purple-50/60 hover:from-indigo-100/90 hover:to-purple-100/80 rounded-2xl border border-indigo-200/80 transition-all flex items-center justify-between shadow-xs hover:shadow-md block"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                <Code className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="heading-font text-xs font-extrabold text-slate-900">
                    Developer Support
                  </h4>
                  <span className="text-[9.5px] font-black text-white bg-indigo-600 px-1.5 py-0.5 rounded-full">
                    DEV
                  </span>
                </div>
                <p className="text-[11px] font-bold text-indigo-600 mt-0.5">
                  @grpbuyer3
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  For technical bugs, custom features & dev help
                </p>
              </div>
            </div>
            <Send className="w-4 h-4 text-indigo-600 group-hover:translate-x-1 transition-transform shrink-0" />
          </a>
        </div>

        {/* Footer Notice */}
        <div className="pt-2 text-center text-[10.5px] font-bold text-slate-400 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Click any handle to open Telegram chat</span>
        </div>
      </div>
    </div>
  );
};
