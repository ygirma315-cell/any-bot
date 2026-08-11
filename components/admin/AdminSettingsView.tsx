'use client';

import React, { useState, useEffect } from 'react';
import { getStoredAdminCredentials, saveStoredAdminCredentials, clearAllStoreHistory, fetchAdminCredentialsFromSupabase } from '@/lib/store';
import { Settings, Lock, CheckCircle2, AlertCircle, KeyRound, Shield, Trash2, RefreshCw, User } from 'lucide-react';

export const AdminSettingsView: React.FC = () => {
  const [adminUsername, setAdminUsername] = useState<string>('admin');
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const creds = getStoredAdminCredentials();
    setAdminUsername(creds.username);
    fetchAdminCredentialsFromSupabase().then((c) => {
      if (c) setAdminUsername(c.username);
    });
  }, []);

  const handleCredentialsChange = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    const { username: currentUsername, password: currentSavedPassword } = getStoredAdminCredentials();

    if (!adminUsername.trim()) {
      setStatusMsg({ type: 'error', message: 'Admin username cannot be empty.' });
      return;
    }

    if (!oldPassword) {
      setStatusMsg({ type: 'error', message: 'Please enter your current old password.' });
      return;
    }

    if (oldPassword !== currentSavedPassword) {
      setStatusMsg({ type: 'error', message: 'Incorrect old password. Please try again.' });
      return;
    }

    const finalPassword = newPassword.trim() ? newPassword : currentSavedPassword;

    if (newPassword && newPassword.length < 4) {
      setStatusMsg({ type: 'error', message: 'New password must be at least 4 characters long.' });
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setStatusMsg({ type: 'error', message: 'New password and confirmation do not match.' });
      return;
    }

    saveStoredAdminCredentials(adminUsername.trim(), finalPassword);

    setStatusMsg({ type: 'success', message: `Admin credentials updated successfully! Username: "${adminUsername.trim()}" is now active in Supabase & Local.` });
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleClearAllHistory = () => {
    if (confirm('DANGER: This will delete ALL order history, customer logs, and visitor user data to start fresh. Proceed?')) {
      clearAllStoreHistory();
      setStatusMsg({ type: 'success', message: 'All order history, user logs, and visitor data have been completely wiped. The store is now reset fresh!' });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-3xl">
      {/* Header */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.04)] space-y-2">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#FF6B00]" />
          Admin Security & System Settings
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Manage system security, update authentication passwords, and reset store logs.
        </p>
      </div>

      {/* Password Change Card */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.04)] space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF6B00]">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Change Admin Password</h3>
            <p className="text-xs text-slate-500 font-medium">Enter your existing password to authorize setting a new password.</p>
          </div>
        </div>

        {statusMsg && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 animate-fadeIn ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMsg.message}</span>
          </div>
        )}

        <form onSubmit={handleCredentialsChange} className="space-y-4">
          {/* Admin Username Input */}
          <div className="space-y-1">
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wide flex items-center gap-1">
              Admin Portal Username <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder="Enter admin username (e.g. admin)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#FF6B00] focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Old Password Input */}
          <div className="space-y-1">
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wide flex items-center gap-1">
              Current Old Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter current password to verify..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#FF6B00] focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* New Password Input */}
          <div className="space-y-1">
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wide flex items-center gap-1">
              New Password <span className="text-slate-400 font-normal">(Leave blank if keeping current password)</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                minLength={4}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (optional)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#FF6B00] focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-1">
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wide flex items-center gap-1">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#FF6B00] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-6 py-3 bg-[#FF6B00] hover:bg-[#E66000] text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              <span>Update Credentials in Supabase</span>
            </button>
          </div>
        </form>
      </div>

      {/* Clear All History & Data Wipe Card */}
      <div className="p-6 bg-white rounded-2xl border border-rose-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.04)] space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Clear All History & Restart Fresh</h3>
            <p className="text-xs text-slate-500 font-medium">Delete all order records, user logs, and visitor data for a clean reset.</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          If you want to clear test data or start with a fresh slate, click below to wipe all order histories and visitor records for all users.
        </p>

        <button
          type="button"
          onClick={handleClearAllHistory}
          className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Wipe All History & Restart Store</span>
        </button>
      </div>
    </div>
  );
};
