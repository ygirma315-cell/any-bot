'use client';

import React from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Mail, 
  Send, 
  Database, 
  Zap, 
  X, 
  Cpu, 
  Layers, 
  Clock, 
  ArrowUpRight,
  GitBranch,
  Terminal,
  Activity
} from 'lucide-react';

interface AdminVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminVersionModal: React.FC<AdminVersionModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const currentVersion = 'v2.4.0';
  const releaseDate = 'August 2026';

  const updates = [
    {
      icon: Zap,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      title: 'Instant Order Acceptance & Zero-Lag Sync',
      desc: 'Completely overhauled order processing pipeline. Eliminated network polling congestion and infinite fetch feedback loops for instantaneous order status updates.'
    },
    {
      icon: Mail,
      color: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
      title: 'Automated SMTP Customer Email Delivery',
      desc: 'Serverless-resilient SMTP transmission with TLS fallback. Customers immediately receive digital credentials, login accounts, direct access links, and warranty details via email.'
    },
    {
      icon: Send,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      title: 'Telegram Customer & Admin Notifications',
      desc: 'Dual-channel real-time notifications via Telegram Bot. Sends order confirmations to users and alerts store administrators on new payments.'
    },
    {
      icon: Database,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      title: 'Dynamic Product Storage & Stock Claiming',
      desc: 'Automatically claims unused credentials from the product_storage table upon order acceptance and decrements product inventory in real time.'
    },
    {
      icon: ShieldCheck,
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
      title: 'Dual Token & Cookie Admin Security',
      desc: 'Secured admin endpoints with cryptographic HMAC SHA-256 tokens and Bearer authentication headers for seamless multi-browser session persistence.'
    }
  ];

  const versionHistory = [
    {
      version: 'v2.4.0',
      tag: 'Current Active',
      tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      date: 'August 2026',
      notes: 'Order Acceptance Engine, SMTP Email Reliability, Network Event Loop Elimination, Admin Version Center.'
    },
    {
      version: 'v2.3.0',
      tag: 'Stable',
      tagColor: 'bg-slate-700/50 text-slate-300 border-slate-600/50',
      date: 'August 2026',
      notes: 'Product Storage credentials inventory management, bulk digital accounts import, and automatic stock syncing.'
    },
    {
      version: 'v2.2.0',
      tag: 'Feature Release',
      tagColor: 'bg-slate-700/50 text-slate-300 border-slate-600/50',
      date: 'July 2026',
      notes: 'Online visitor analytics, Telegram user mapping, and 24-hour activity tracking in admin panel.'
    },
    {
      version: 'v2.1.0',
      tag: 'Feature Release',
      tagColor: 'bg-slate-700/50 text-slate-300 border-slate-600/50',
      date: 'July 2026',
      notes: 'Custom categories management, payment methods manager, and drag-and-drop sort ordering.'
    },
    {
      version: 'v2.0.0',
      tag: 'Major Update',
      tagColor: 'bg-slate-700/50 text-slate-300 border-slate-600/50',
      date: 'June 2026',
      notes: 'Full Supabase PostgreSQL cloud migration, serverless API routes, and secure admin authentication.'
    },
    {
      version: 'v1.0.0',
      tag: 'Initial Launch',
      tagColor: 'bg-slate-700/50 text-slate-300 border-slate-600/50',
      date: 'May 2026',
      notes: 'Initial AnyAi Store WebApp and Telegram Bot release.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh] animate-scaleUp">
        
        {/* Header with Gradient Ribbon */}
        <div className="relative p-5 sm:p-7 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 p-0.5 shadow-lg shadow-orange-500/20 flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-orange-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="heading-font text-lg sm:text-xl font-black text-white tracking-tight">
                    AnyAi STORE
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 text-xs font-black shadow-xs">
                    {currentVersion}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1">
                    <Activity className="w-3 h-3 animate-pulse" /> Production Ready
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  System Version &amp; App Update Changelog • Released {releaseDate}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-colors shrink-0"
              title="Close version modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-7 overflow-y-auto custom-scrollbar space-y-6 flex-1">
          
          {/* Quick System Status Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>Database</span>
              </div>
              <p className="text-xs font-black text-white">Supabase Cloud</p>
              <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> Connected
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <Mail className="w-3.5 h-3.5 text-orange-400" />
                <span>Email Engine</span>
              </div>
              <p className="text-xs font-black text-white">SMTP Transport</p>
              <p className="text-[10px] text-orange-400 font-semibold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> Configured
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <Send className="w-3.5 h-3.5 text-blue-400" />
                <span>Telegram Bot</span>
              </div>
              <p className="text-xs font-black text-white">Bot API Webhook</p>
              <p className="text-[10px] text-blue-400 font-semibold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> Active
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Admin Auth</span>
              </div>
              <p className="text-xs font-black text-white">HMAC SHA-256</p>
              <p className="text-[10px] text-purple-400 font-semibold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> Encrypted
              </p>
            </div>
          </div>

          {/* What's New Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span>What&apos;s New in {currentVersion}</span>
            </h3>
            
            <div className="space-y-2.5">
              {updates.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <div 
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800/90 hover:border-slate-700/80 transition-all flex items-start gap-3.5"
                  >
                    <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${item.color}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <h4 className="text-xs font-extrabold text-slate-100">{item.title}</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-medium">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Release History Timeline */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-slate-400" />
              <span>Version History &amp; Changelog</span>
            </h3>

            <div className="space-y-2">
              {versionHistory.map((item, idx) => (
                <div 
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-white">{item.version}</span>
                      <span className={`px-2 py-0.5 rounded-md border text-[9.5px] font-bold ${item.tagColor}`}>
                        {item.tag}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">({item.date})</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium">{item.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-slate-500 font-semibold truncate">
            AnyAi Store Control Center • System v2.4.0
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95"
          >
            Got it
          </button>
        </div>

      </div>
    </div>
  );
};
