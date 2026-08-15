'use client';

import React, { useState } from 'react';
import { VisitorRecord } from '@/lib/store';
import { 
  Users, 
  UserCheck, 
  ShieldCheck, 
  Clock, 
  ExternalLink, 
  Activity, 
  Globe, 
  Send, 
  Search,
  CheckCircle2,
  Filter
} from 'lucide-react';

interface AdminUsersViewProps {
  visitors: VisitorRecord[];
  onlineCount24h: number;
}

type UserFilter = 'all' | 'active' | 'registered' | 'web';

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({
  visitors,
  onlineCount24h
}) => {
  const [filter, setFilter] = useState<UserFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const isWebVisitor = (user: VisitorRecord) => {
    return Boolean(
      user.isWebVisitor || 
      user.telegramId >= 8000000000 || 
      user.telegramId === 987654321 ||
      (!user.username && user.first_name?.toLowerCase().includes('web'))
    );
  };

  const registeredUsers = visitors.filter(u => u.hasOrdered);
  const active24hUsers = visitors.filter(u => new Date(u.lastActive) >= cutoff24h);
  const directWebUsers = visitors.filter(u => isWebVisitor(u));

  const filteredVisitors = visitors.filter(u => {
    // 1. Category Filter
    if (filter === 'active' && new Date(u.lastActive) < cutoff24h) return false;
    if (filter === 'registered' && !u.hasOrdered) return false;
    if (filter === 'web' && !isWebVisitor(u)) return false;

    // 2. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase().includes(q);
      const userMatch = (u.username || '').toLowerCase().includes(q);
      const idMatch = String(u.telegramId).includes(q);
      if (!nameMatch && !userMatch && !idMatch) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Metric Cards (Clickable for quick filtering) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Active Users (24 Hours) */}
        <button
          type="button"
          onClick={() => setFilter('active')}
          className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden ${
            filter === 'active'
              ? 'bg-purple-950/20 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.15)] ring-2 ring-purple-500/20'
              : 'bg-white border-slate-200/80 hover:border-purple-300 shadow-[0_2px_10px_rgba(15,23,42,0.04)]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            {filter === 'active' && (
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                Active Filter
              </span>
            )}
          </div>
          <div className="mt-3">
            <span className="text-[10.5px] font-bold text-slate-400 tracking-wider uppercase block">ACTIVE USERS (24H)</span>
            <p className="heading-font text-2xl font-black text-slate-900 mt-0.5">{onlineCount24h}</p>
            <p className="text-[11px] text-purple-600 font-bold mt-0.5">Showed up in the last 24 hours</p>
          </div>
        </button>

        {/* Metric 2: Registered Users */}
        <button
          type="button"
          onClick={() => setFilter('registered')}
          className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden ${
            filter === 'registered'
              ? 'bg-emerald-950/20 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200/80 hover:border-emerald-300 shadow-[0_2px_10px_rgba(15,23,42,0.04)]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            {filter === 'registered' && (
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                Active Filter
              </span>
            )}
          </div>
          <div className="mt-3">
            <span className="text-[10.5px] font-bold text-slate-400 tracking-wider uppercase block">REGISTERED USERS</span>
            <p className="heading-font text-2xl font-black text-slate-900 mt-0.5">{registeredUsers.length}</p>
            <p className="text-[11px] text-emerald-600 font-bold mt-0.5">Customers who placed orders</p>
          </div>
        </button>

        {/* Metric 3: Total Visitors */}
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden ${
            filter === 'all'
              ? 'bg-indigo-950/20 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.15)] ring-2 ring-indigo-500/20'
              : 'bg-white border-slate-200/80 hover:border-indigo-300 shadow-[0_2px_10px_rgba(15,23,42,0.04)]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            {filter === 'all' && (
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                Active Filter
              </span>
            )}
          </div>
          <div className="mt-3">
            <span className="text-[10.5px] font-bold text-slate-400 tracking-wider uppercase block">TOTAL / ALL VISITORS</span>
            <p className="heading-font text-2xl font-black text-slate-900 mt-0.5">{visitors.length}</p>
            <p className="text-[11px] text-indigo-600 font-bold mt-0.5">All historical website &amp; bot visits</p>
          </div>
        </button>
      </div>

      {/* Users Table Card with Filter Tabs & Search */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.04)] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#FF6B00]" />
              User Analytics &amp; Visitor Directory
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Differentiated view for active visitors, registered customers, and direct website visitors.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user name or ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-orange-500 transition"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-100">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              filter === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Total Visitors ({visitors.length})
          </button>

          <button
            onClick={() => setFilter('active')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              filter === 'active'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Active Users (24h) ({active24hUsers.length})
          </button>

          <button
            onClick={() => setFilter('registered')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              filter === 'registered'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Registered Only ({registeredUsers.length})
          </button>

          <button
            onClick={() => setFilter('web')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              filter === 'web'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Direct Web Visitors ({directWebUsers.length})
          </button>
        </div>

        {filteredVisitors.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-600">No visitors found for this filter.</p>
            <p className="text-[11px] text-slate-400">Try changing the filter or search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">CUSTOMER / VISITOR</th>
                  <th className="py-3 px-3">SOURCE CHANNEL</th>
                  <th className="py-3 px-3">TELEGRAM USERNAME</th>
                  <th className="py-3 px-3">TELEGRAM ID</th>
                  <th className="py-3 px-3">LAST ACTIVE</th>
                  <th className="py-3 px-3">REGISTERED / STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredVisitors.map((user, idx) => {
                  const isWeb = isWebVisitor(user);
                  const handle = user.username ? `@${user.username}` : '-';
                  const fullName = `${user.first_name || (isWeb ? 'Website Visitor' : 'Customer')} ${user.last_name || ''}`.trim();
                  const isRecent24h = new Date(user.lastActive) >= cutoff24h;

                  return (
                    <tr key={`${user.telegramId}_${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      {/* Customer Name */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full font-black text-xs flex items-center justify-center shrink-0 ${
                            isWeb ? 'bg-blue-100 text-blue-700' : 'bg-slate-900 text-white'
                          }`}>
                            {isWeb ? '🌐' : (user.first_name ? user.first_name.charAt(0).toUpperCase() : 'U')}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{fullName}</p>
                            <p className="text-[10px] text-slate-400">
                              {isWeb ? 'Direct Website Visitor' : `Telegram User`}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Source Channel */}
                      <td className="py-3.5 px-3">
                        {isWeb ? (
                          <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                            <Globe className="w-3 h-3 text-blue-500" />
                            Direct Web
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                            <Send className="w-3 h-3 text-sky-500" />
                            Telegram App
                          </span>
                        )}
                      </td>

                      {/* Telegram Username */}
                      <td className="py-3.5 px-3">
                        {!isWeb && user.username ? (
                          <a
                            href={`https://t.me/${user.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-lg border border-orange-100 transition-colors"
                          >
                            <span>{handle}</span>
                            <ExternalLink className="w-3 h-3 text-orange-500" />
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono font-bold">-</span>
                        )}
                      </td>

                      {/* Telegram ID (Blank / '-' for Direct Web Visitors per instruction) */}
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-800">
                        {isWeb ? (
                          <span className="text-slate-400 font-bold">-</span>
                        ) : (
                          <code>{user.telegramId}</code>
                        )}
                      </td>

                      {/* Last Active */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5 text-slate-600 font-semibold text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(user.lastActive).toLocaleString()}</span>
                          {isRecent24h && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 text-[9.5px] font-extrabold border border-purple-100">
                              Active (24h)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Order Status */}
                      <td className="py-3.5 px-3">
                        {user.hasOrdered ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Registered (Ordered)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                            <span>Visitor Only</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
