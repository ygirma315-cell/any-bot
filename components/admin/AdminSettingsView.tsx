'use client';

import React, { useState, useEffect } from 'react';
import { 
  getStoredAdminCredentials, 
  saveStoredAdminCredentials, 
  clearAllStoreHistory, 
  fetchAdminCredentialsFromSupabase,
  fetchSmtpStatus,
  sendTestEmail
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
  ShieldCheck,
  Mail,
  Send,
  ExternalLink,
  Copy,
  Terminal,
  Sparkles
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

  // SMTP & Live Email Testing State
  const [smtpStatus, setSmtpStatus] = useState<any>(null);
  const [testEmailInput, setTestEmailInput] = useState<string>('');
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    const creds = getStoredAdminCredentials();
    setAdminUsername(creds.username);
    fetchAdminCredentialsFromSupabase().then((c) => {
      if (c) setAdminUsername(c.username);
    });
    fetchSmtpStatus().then(status => {
      if (status) setSmtpStatus(status);
    });
  }, []);

  const handleRefreshSmtpStatus = async () => {
    const status = await fetchSmtpStatus();
    if (status) {
      setSmtpStatus(status);
      setStatusMsg({ type: 'success', message: '⚡ Email configuration status refreshed!' });
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const handleSendLiveTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailInput || !testEmailInput.includes('@')) {
      setTestResult({ success: false, message: 'Please enter a valid recipient email address.' });
      return;
    }

    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await sendTestEmail(testEmailInput.trim());
      if (res.success && res.emailSent) {
        setTestResult({
          success: true,
          message: `✅ LIVE TEST EMAIL SENT SUCCESSFULLY! Delivered via ${res.provider || 'SMTP'} to ${testEmailInput}. Check your inbox & spam folder.`
        });
      } else {
        setTestResult({
          success: false,
          message: `❌ Test delivery failed: ${res.error || 'SMTP service unconfigured or connection rejected'}.`
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `❌ Network error while dispatching test: ${err.message || 'Unknown error'}`
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleCopyLink = (text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedLink(label);
      setTimeout(() => setCopiedLink(null), 2500);
    }
  };

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

      {/* SMTP & EMAIL DELIVERY & LIVE TEST SUITE */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.04)] space-y-6">
        {/* Card Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF6B00] shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                Automated Customer Email Delivery &amp; Live Test Suite
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Verify SMTP connection, trigger live test emails, and inspect serverless delivery status.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefreshSmtpStatus}
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all text-xs font-bold flex items-center gap-1.5 shrink-0"
            title="Refresh status from server"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh Status</span>
          </button>
        </div>

        {/* Current Configuration Status Banner */}
        <div className={`p-4 rounded-2xl border ${
          smtpStatus?.isConfigured 
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' 
            : 'bg-amber-50/80 border-amber-200 text-amber-950'
        } space-y-2`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wide flex items-center gap-1.5">
              {smtpStatus?.isConfigured ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Email Engine: ACTIVE ({smtpStatus.provider})</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Email Engine: UNCONFIGURED (MISSING SMTP ENV VARS)</span>
                </>
              )}
            </span>

            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
              smtpStatus?.isConfigured
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-amber-100 text-amber-800 border-amber-300'
            }`}>
              {smtpStatus?.isConfigured ? 'Ready to Deliver' : 'Action Required'}
            </span>
          </div>

          <p className="text-xs font-medium leading-relaxed opacity-90">
            {smtpStatus?.isConfigured
              ? `Your store is configured to deliver credentials via ${smtpStatus.provider} (Host: ${smtpStatus.host}, Sender: ${smtpStatus.from}). Customers automatically receive account credentials on order acceptance.`
              : 'Orders accepted by the admin currently cannot send emails because SMTP credentials are not found in .env.local or Vercel Environment Variables. Follow the setup guide below to activate delivery.'}
          </p>

          {smtpStatus && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px]">
              <div className="p-2 bg-white/80 rounded-lg border border-slate-200/60">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Provider</span>
                <span className="font-extrabold text-slate-800">{smtpStatus.provider}</span>
              </div>
              <div className="p-2 bg-white/80 rounded-lg border border-slate-200/60">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">SMTP Host</span>
                <span className="font-extrabold text-slate-800 truncate block">{smtpStatus.host}</span>
              </div>
              <div className="p-2 bg-white/80 rounded-lg border border-slate-200/60">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Username</span>
                <span className="font-extrabold text-slate-800 truncate block">{smtpStatus.user}</span>
              </div>
              <div className="p-2 bg-white/80 rounded-lg border border-slate-200/60">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Sender From</span>
                <span className="font-extrabold text-slate-800 truncate block">{smtpStatus.from}</span>
              </div>
            </div>
          )}
        </div>

        {/* Live Test Email Sender Form */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <Send className="w-4 h-4 text-[#FF6B00]" />
              <span>Send Live Test Delivery Email</span>
            </span>
            <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
              Interactive Test
            </span>
          </div>

          <p className="text-xs text-slate-600 font-medium">
            Enter your email below to send a live subscription credentials email test. This verifies your SMTP connection and renders the exact customer confirmation email.
          </p>

          <form onSubmit={handleSendLiveTestEmail} className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={testEmailInput}
                  onChange={(e) => setTestEmailInput(e.target.value)}
                  placeholder="Enter recipient email (e.g. your_email@gmail.com)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20 transition-all shadow-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isSendingTest}
                className="px-5 py-2.5 bg-[#FF6B00] hover:bg-[#E66000] disabled:opacity-60 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 shrink-0"
              >
                <Send className={`w-3.5 h-3.5 ${isSendingTest ? 'animate-spin' : ''}`} />
                <span>{isSendingTest ? 'Sending Test...' : '🚀 Send Live Test Email'}</span>
              </button>
            </div>
          </form>

          {/* Test Execution Result Banner */}
          {testResult && (
            <div className={`p-4 rounded-xl border text-xs font-bold animate-fadeIn ${
              testResult.success 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}>
              <div className="flex items-start gap-2">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span className="leading-relaxed">{testResult.message}</span>
              </div>
            </div>
          )}
        </div>

        {/* Live Testing URL & Quick API Links */}
        <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
              <Terminal className="w-4 h-4" />
              <span>Direct Live Testing Links</span>
            </span>
            <span className="text-[10px] font-bold text-slate-400">REST Diagnostic Endpoints</span>
          </div>

          <p className="text-xs text-slate-300 font-medium">
            You can trigger live delivery testing directly from your browser or curl by hitting either of these endpoints:
          </p>

          <div className="space-y-2 text-xs">
            {/* URL 1: /api/debug */}
            <div className="flex items-center justify-between p-2.5 bg-slate-800/90 rounded-xl border border-slate-700 font-mono text-[11px]">
              <span className="text-emerald-400 truncate mr-2">
                https://aiunlimited.shop/api/debug?testEmail={testEmailInput || 'your_email@gmail.com'}
              </span>
              <button
                type="button"
                onClick={() => handleCopyLink(`https://aiunlimited.shop/api/debug?testEmail=${testEmailInput || 'your_email@gmail.com'}`, 'debug')}
                className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-sans font-bold text-[10.5px] transition shrink-0 flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedLink === 'debug' ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            {/* URL 2: /api/test-email */}
            <div className="flex items-center justify-between p-2.5 bg-slate-800/90 rounded-xl border border-slate-700 font-mono text-[11px]">
              <span className="text-orange-400 truncate mr-2">
                https://aiunlimited.shop/api/test-email?to={testEmailInput || 'your_email@gmail.com'}
              </span>
              <button
                type="button"
                onClick={() => handleCopyLink(`https://aiunlimited.shop/api/test-email?to=${testEmailInput || 'your_email@gmail.com'}`, 'test-email')}
                className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-sans font-bold text-[10.5px] transition shrink-0 flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedLink === 'test-email' ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick SMTP Setup Guide */}
        <div className="p-5 rounded-2xl bg-orange-50/60 border border-orange-200/80 space-y-3">
          <h4 className="text-xs font-black text-orange-950 uppercase tracking-wide flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#FF6B00]" />
            <span>How to set up SMTP in .env.local or Vercel:</span>
          </h4>

          <div className="space-y-3 text-xs text-orange-950/90 font-medium leading-relaxed">
            <div className="p-3 bg-white rounded-xl border border-orange-200">
              <strong className="text-slate-900 block mb-1">Option 1: Gmail (100% Free &amp; Easy)</strong>
              <p className="text-[11.5px] text-slate-600 mb-2">
                1. Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-[#FF6B00] font-bold underline">Google Account &rarr; Security &rarr; 2-Step Verification &rarr; App Passwords</a>.<br />
                2. Generate a 16-letter App Password for &ldquo;Mail&rdquo;.<br />
                3. Add these variables to your <code>.env.local</code> and Vercel project settings:
              </p>
              <pre className="p-2.5 bg-slate-900 text-emerald-400 rounded-lg text-[11px] font-mono overflow-x-auto">
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_gmail_address@gmail.com
SMTP_PASS=your_16_character_app_password
SMTP_FROM=AnyAi STORE &lt;your_gmail_address@gmail.com&gt;</pre>
            </div>

            <div className="p-3 bg-white rounded-xl border border-orange-200">
              <strong className="text-slate-900 block mb-1">Option 2: Resend API (Fastest Serverless Delivery)</strong>
              <p className="text-[11.5px] text-slate-600 mb-2">
                Create a free account at <a href="https://resend.com" target="_blank" rel="noreferrer" className="text-[#FF6B00] font-bold underline">resend.com</a>, grab your API Key, and set:
              </p>
              <pre className="p-2.5 bg-slate-900 text-emerald-400 rounded-lg text-[11px] font-mono overflow-x-auto">
RESEND_API_KEY=re_your_api_key_here
SMTP_FROM=AnyAi STORE &lt;onboarding@resend.dev&gt;</pre>
            </div>
          </div>
        </div>
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
