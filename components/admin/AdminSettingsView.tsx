'use client';

import React, { useState, useEffect } from 'react';
import { 
  getStoredAdminCredentials, 
  saveStoredAdminCredentials, 
  clearAllStoreHistory, 
  fetchAdminCredentialsFromSupabase 
} from '@/lib/store';
import { 
  Settings, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  Shield, 
  Trash2, 
  RefreshCw, 
  User, 
  Eye, 
  EyeOff, 
  Check, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const AdminSettingsView: React.FC = () => {
  const [adminUsername, setAdminUsername] = useState<string>('admin');
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  // Password visibility states
  const [showOldPassword, setShowOldPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const creds = getStoredAdminCredentials();
    setAdminUsername(creds.username);
    fetchAdminCredentialsFromSupabase().then((c) => {
      if (c) setAdminUsername(c.username);
    });
  }, []);

  const handleCredentialsChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    const { username: currentUsername, password: currentSavedPassword } = getStoredAdminCredentials();

    if (!adminUsername.trim()) {
      setStatusMsg({ type: 'error', message: 'Admin username cannot be empty.' });
      return;
    }

    if (!oldPassword) {
      setStatusMsg({ type: 'error', message: 'Step 1 Error: Please enter your current password to authorize this change.' });
      return;
    }

    if (oldPassword !== currentSavedPassword) {
      setStatusMsg({ type: 'error', message: 'Step 1 Error: Incorrect current password. Please verify and try again.' });
      return;
    }

    if (!newPassword.trim()) {
      setStatusMsg({ type: 'error', message: 'Step 2 Error: Please enter a new password.' });
      return;
    }

    if (newPassword.length < 4) {
      setStatusMsg({ type: 'error', message: 'Step 2 Error: New password must be at least 4 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: 'error', message: 'Step 2 Error: New password and Confirmation do not match.' });
      return;
    }

    setIsSaving(true);

    try {
      saveStoredAdminCredentials(adminUsername.trim(), newPassword.trim());

      setStatusMsg({ 
        type: 'success', 
        message: `✅ Admin password & credentials updated successfully! New password is now securely stored in Supabase database & local session.` 
      });

      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowOldPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch {
      setStatusMsg({ type: 'error', message: 'An error occurred while saving credentials.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearAllHistory = () => {
    if (confirm('DANGER: This will delete ALL order history, customer logs, and visitor user data to start fresh. Proceed?')) {
      clearAllStoreHistory();
      setStatusMsg({ type: 'success', message: 'All order history, user logs, and visitor data have been completely wiped. The store is now reset fresh!' });
    }
  };

  const passwordsMatch = Boolean(newPassword && confirmPassword && newPassword === confirmPassword);
  const isLengthValid = newPassword.length >= 4;

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-3xl">
      {/* Header */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.04)] space-y-2">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#FF6B00]" />
          Admin Security &amp; Password Settings
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Manage admin authentication credentials, change password with multi-step verification, and inspect security settings.
        </p>
      </div>

      {/* Status Feedback Toast / Banner */}
      {statusMsg && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-start gap-2.5 animate-fadeIn shadow-xs ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900'
              : 'bg-rose-50/90 border-rose-300 text-rose-900'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span className="leading-relaxed">{statusMsg.message}</span>
        </div>
      )}

      {/* Step-by-Step Password Change Card */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.04)] space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF6B00] shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Change Admin Password &amp; Username</h3>
            <p className="text-xs text-slate-500 font-medium">
              Follow the 2-step verification process to set and store a new admin password.
            </p>
          </div>
        </div>

        <form onSubmit={handleCredentialsChange} className="space-y-6">
          {/* STEP 1: VERIFY CURRENT PASSWORD */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#FF6B00] text-white font-black text-[10px] flex items-center justify-center">1</span>
                <span>Step 1: Enter Current Password</span>
              </span>
              <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                Security Verification
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">
                Current Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showOldPassword ? 'text' : 'password'}
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter your current active password to unlock change..."
                  className="w-full pl-10 pr-11 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20 transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition"
                  title={showOldPassword ? 'Hide password' : 'Show password'}
                >
                  {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* STEP 2: SET NEW CREDENTIALS */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center">2</span>
                <span>Step 2: Set New Credentials</span>
              </span>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                New Security Keys
              </span>
            </div>

            {/* Admin Username */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">
                Admin Username <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="Enter admin username..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all shadow-xs"
                />
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">
                New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={4}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 4 characters)..."
                  className="w-full pl-10 pr-11 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition"
                  title={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">
                Confirm New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password to verify..."
                  className="w-full pl-10 pr-11 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Real-time Checklist Badges */}
            {newPassword && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-md border ${
                  isLengthValid 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  <Check className={`w-3 h-3 ${isLengthValid ? 'text-emerald-600' : 'text-slate-400'}`} />
                  At least 4 characters
                </span>

                {confirmPassword && (
                  <span className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-md border ${
                    passwordsMatch 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    <Check className={`w-3 h-3 ${passwordsMatch ? 'text-emerald-600' : 'text-rose-500'}`} />
                    {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Submit Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-3.5 bg-[#FF6B00] hover:bg-[#E66000] disabled:opacity-60 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSaving ? 'Saving New Password...' : 'Save & Store New Password in Supabase'}</span>
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
            <h3 className="text-sm font-extrabold text-slate-900">Clear All History &amp; Restart Fresh</h3>
            <p className="text-xs text-slate-500 font-medium">Delete all order records, user logs, and visitor data for a clean reset.</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          If you want to clear test data or start with a fresh slate, click below to wipe all order histories and visitor records for all users.
        </p>

        <button
          type="button"
          onClick={handleClearAllHistory}
          className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Wipe All History &amp; Restart Store</span>
        </button>
      </div>
    </div>
  );
};
