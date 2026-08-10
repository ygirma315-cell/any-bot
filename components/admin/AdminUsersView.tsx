'use client';

import React from 'react';
import { VisitorRecord } from '@/lib/store';
import { Users, UserCheck, ShieldCheck, Clock, ExternalLink, Activity } from 'lucide-react';

interface AdminUsersViewProps {
  visitors: VisitorRecord[];
  onlineCount24h: number;
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({
  visitors,
  onlineCount24h
}) => {
  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Metric 1: Online Users 24h */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.04)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10.5px] font-bold text-slate-400 tracking-wider uppercase block">ONLINE USERS (PAST 24 HOURS)</span>
            <p className="heading-font text-2xl font-black text-slate-900 mt-0.5">{onlineCount24h}</p>
            <p className="text-[11px] text-purple-600 font-bold mt-0.5">Active visitors in last 24h</p>
          </div>
        </div>

        {/* Metric 2: Total Registered / Logged Users */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.04)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10.5px] font-bold text-slate-400 tracking-wider uppercase block">REGISTERED USERS</span>
            <p className="heading-font text-2xl font-black text-slate-900 mt-0.5">{visitors.length}</p>
            <p className="text-[11px] text-indigo-600 font-bold mt-0.5">Total Telegram accounts tracked</p>
          </div>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.04)] space-y-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#FF6B00]" />
            Registered Users & Visitor Analytics
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time track of users entering the Telegram Mini App within 24 hours, displaying their Telegram ID, Name, Username, and Activity Status.
          </p>
        </div>

        {visitors.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-600">No visitors recorded yet.</p>
            <p className="text-[11px] text-slate-400">Visitors entering the website or Mini App will automatically appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">CUSTOMER NAME</th>
                  <th className="py-3 px-3">TELEGRAM USERNAME</th>
                  <th className="py-3 px-3">TELEGRAM ID</th>
                  <th className="py-3 px-3">LAST ACTIVE</th>
                  <th className="py-3 px-3">ORDER STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {visitors.map((user) => {
                  const handle = user.username ? `@${user.username}` : 'No handle';
                  const fullName = `${user.first_name || 'Customer'} ${user.last_name || ''}`.trim();
                  const isRecent24h = new Date(user.lastActive) >= new Date(Date.now() - 24 * 60 * 60 * 1000);

                  return (
                    <tr key={user.telegramId} className="hover:bg-slate-50/80 transition-colors">
                      {/* Customer Name */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                            {user.first_name ? user.first_name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{fullName}</p>
                            <p className="text-[10px] text-slate-400">User ID: {user.telegramId}</p>
                          </div>
                        </div>
                      </td>

                      {/* Telegram Username */}
                      <td className="py-3.5 px-3">
                        {user.username ? (
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
                          <span className="text-[11px] text-slate-400 font-semibold">{handle}</span>
                        )}
                      </td>

                      {/* Telegram ID */}
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-800">
                        <code>{user.telegramId}</code>
                      </td>

                      {/* Last Active */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5 text-slate-600 font-semibold text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(user.lastActive).toLocaleString()}</span>
                          {isRecent24h && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9.5px] font-extrabold border border-emerald-100">
                              Online 24h
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Order Status */}
                      <td className="py-3.5 px-3">
                        {user.hasOrdered ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Has Ordered</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                            <span>Visited Only</span>
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
