'use client';

import React, { useState, useEffect } from 'react';
import { AdminLogin } from '@/components/admin/AdminLogin';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const authStatus = sessionStorage.getItem('ai_store_admin_authenticated');
    if (authStatus !== 'true') {
      setIsLoading(false);
      return;
    }
    // Verify the server-side session cookie is still valid by hitting a
    // lightweight authenticated endpoint. If the cookie expired or was
    // cleared, force the user back to login instead of showing a broken
    // dashboard where every API call fails with 401.
    fetch('/api/admin/database?resource=orders', { credentials: 'include' })
      .then(res => {
        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          // Session expired or invalid — clear stale client state
          sessionStorage.removeItem('ai_store_admin_authenticated');
          sessionStorage.removeItem('ai_store_admin_token');
        }
      })
      .catch(() => {
        // Network error — let them through anyway; the dashboard will
        // show appropriate errors on its own fetch attempts.
        setIsAuthenticated(true);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('ai_store_admin_authenticated');
    sessionStorage.removeItem('ai_store_admin_token');
    void fetch('/api/admin/session', { method: 'DELETE' });
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
        Loading Admin Portal...
      </div>
    );
  }

  return isAuthenticated ? (
    <AdminDashboard onLogout={handleLogout} />
  ) : (
    <AdminLogin onLoginSuccess={handleLoginSuccess} />
  );
}
