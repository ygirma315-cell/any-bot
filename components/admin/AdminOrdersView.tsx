'use client';

import React, { useState, useEffect } from 'react';
import { OrderPayload } from '@/lib/bot';
import { getStoredOrders, updateOrderStatus, clearAllOrders, fetchOrdersFromSupabase, getStoredAdminPassword } from '@/lib/store';
import { Clock, CheckCircle2, XCircle, User, Mail, Send, AlertTriangle, ShieldCheck, RefreshCw, Sparkles, Filter, Trash2, Lock, X } from 'lucide-react';

export const AdminOrdersView: React.FC = () => {
  const [orders, setOrders] = useState<OrderPayload[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Security Clear Orders Modal State
  const [isClearModalOpen, setIsClearModalOpen] = useState<boolean>(false);
  const [confirmPasswordInput, setConfirmPasswordInput] = useState<string>('');
  const [clearError, setClearError] = useState<string | null>(null);

  const [isManualLoading, setIsManualLoading] = useState<boolean>(false);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

  const areOrdersEqual = (a: OrderPayload[], b: OrderPayload[]) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i].orderId !== b[i].orderId || a[i].status !== b[i].status) return false;
    }
    return true;
  };

  const loadOrders = async (isManual = false) => {
    if (isManual) setIsManualLoading(true);
    try {
      const data = await fetchOrdersFromSupabase();
      if (data && Array.isArray(data)) {
        setOrders(prev => areOrdersEqual(prev, data) ? prev : data);
      } else {
        const stored = getStoredOrders();
        setOrders(prev => areOrdersEqual(prev, stored) ? prev : stored);
      }
      if (isManual) {
        setToastMessage('⚡ Orders refreshed from Supabase DB!');
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch {
      // ignore background error
    } finally {
      if (isManual) {
        setIsManualLoading(false);
      }
    }
  };

  const handleOpenClearModal = () => {
    setConfirmPasswordInput('');
    setClearError(null);
    setIsClearModalOpen(true);
  };

  const handleConfirmClearOrders = (e: React.FormEvent) => {
    e.preventDefault();
    setClearError(null);

    const actualPassword = getStoredAdminPassword();
    if (confirmPasswordInput !== actualPassword) {
      setClearError('Incorrect Admin Password! Order deletion cancelled.');
      return;
    }

    clearAllOrders();
    loadOrders(false);
    setIsClearModalOpen(false);
    setConfirmPasswordInput('');
    setToastMessage('🗑️ All order history deleted permanently from Supabase DB & Local!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    loadOrders(false);
    const handleUpdate = () => loadOrders(false);
    window.addEventListener('ai_store_orders_updated', handleUpdate);

    // Calm 30-second background poll (skipped if an order is currently being accepted/rejected)
    const interval = setInterval(() => {
      if (!processingOrderId && !isClearModalOpen) {
        loadOrders(false);
      }
    }, 30000);

    return () => {
      window.removeEventListener('ai_store_orders_updated', handleUpdate);
      clearInterval(interval);
    };
  }, [processingOrderId, isClearModalOpen]);

  const handleAcceptOrder = async (order: OrderPayload) => {
    setProcessingOrderId(order.orderId);
    const result = await updateOrderStatus(order.orderId, 'Accepted', order);
    setProcessingOrderId(null);
    const userHandle = order.telegramUser.username ? `@${order.telegramUser.username}` : order.telegramUser.first_name;
    
    if (result && !result.success) {
      const errDetail = result.error || 'Unknown error';
      if (errDetail.includes('login required') || errDetail.includes('401')) {
        setToastMessage(`❌ Accept failed: Admin session expired. Please log out and log back in.`);
      } else {
        setToastMessage(`❌ Accept failed: ${errDetail}`);
      }
    } else {
      setToastMessage(`✅ Order ${order.orderId} ACCEPTED! Bot notification sent to ${userHandle}.`);
    }
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleRejectOrder = async (order: OrderPayload) => {
    setProcessingOrderId(order.orderId);
    const result = await updateOrderStatus(order.orderId, 'Rejected', order);
    setProcessingOrderId(null);
    if (result && !result.success) {
      const errDetail = result.error || 'Unknown error';
      if (errDetail.includes('login required') || errDetail.includes('401')) {
        setToastMessage(`❌ Reject failed: Admin session expired. Please log out and log back in.`);
      } else {
        setToastMessage(`❌ Reject failed: ${errDetail}`);
      }
    } else {
      setToastMessage(`❌ Order ${order.orderId} REJECTED. Bot notification sent.`);
    }
    setTimeout(() => setToastMessage(null), 5000);
  };

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === 'All') return true;
    if (filterStatus === 'Pending') return o.status === 'Pending' || o.status === 'Payment Submitted';
    if (filterStatus === 'Accepted') return o.status === 'Accepted' || o.status === 'Completed' || o.status === 'Payment Confirmed';
    if (filterStatus === 'Rejected') return o.status === 'Rejected' || o.status === 'Cancelled';
    return true;
  });

  const pendingCount = orders.filter(o => o.status === 'Pending' || o.status === 'Payment Submitted').length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/95 p-4 rounded-2xl border border-slate-200/90 shadow-sm">
        <div>
          <h2 className="heading-font text-lg font-black text-slate-900 flex items-center gap-2">
            📦 Incoming Orders Management
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-xs font-extrabold animate-pulse">
                {pendingCount} Pending
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Review payment proof, verify customer Telegram handles, and release digital credentials
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto overflow-x-auto">
          {['All', 'Pending', 'Accepted', 'Rejected'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                filterStatus === status
                  ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {status}
            </button>
          ))}

          <button
            type="button"
            onClick={() => loadOrders(true)}
            className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 shrink-0"
            title="Refresh orders from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isManualLoading ? 'animate-spin text-orange-600' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenClearModal}
            className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 text-xs font-bold transition-all shrink-0 flex items-center gap-1"
            title="Clear all orders history"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Orders</span>
          </button>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold shadow-lg flex items-center gap-2 animate-fadeIn border border-slate-800">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Orders Table */}
      {filteredOrders.length > 0 ? (
        <div className="bg-white/95 rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="py-3 px-4">Item / Product</th>
                  <th className="py-3 px-4">Telegram Username</th>
                  <th className="py-3 px-4">Telegram ID</th>
                  <th className="py-3 px-4">Delivery Email</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4 text-right">Status / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
                {filteredOrders.map((order) => {
                  const isPending = order.status === 'Pending' || order.status === 'Payment Submitted';
                  const isAccepted = order.status === 'Accepted' || order.status === 'Completed' || order.status === 'Payment Confirmed';
                  const isWeb = Boolean(
                    order.telegramUser.id >= 8000000000 || 
                    order.telegramUser.id === 987654321 || 
                    (!order.telegramUser.username && order.telegramUser.first_name?.toLowerCase().includes('web'))
                  );
                  const userHandle = isWeb ? '-' : (order.telegramUser.username ? `@${order.telegramUser.username}` : (order.telegramUser.first_name || '-'));
                  const creds = order.deliveredCredentials || [];

                  return (
                    <tr key={order.orderId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {order.items.map((i) => `${i.name} (×${i.quantity})`).join(', ')}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 tracking-tight mt-0.5">
                          {order.orderId} · {order.timestamp}
                        </div>
                        {isAccepted && creds.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {creds.map((c, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded">
                                🔑 {c.product_name || c.type || 'Credential'}: {c.username || c.link ? (c.username ? `${c.username}` : 'Link') : 'Assigned'}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {isWeb ? (
                          <span className="inline-flex items-center gap-1 font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md text-[11px] border border-blue-100">
                            🌐 Web Visitor
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md text-[11px]">
                            {userHandle}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {isWeb ? <span className="text-slate-400 font-bold">-</span> : (order.telegramUser.id || '-')}
                      </td>

                      <td className="py-3.5 px-4">
                        {order.deliveryEmail ? (
                          <div className="flex items-center gap-1 text-slate-700 font-semibold">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{order.deliveryEmail}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Not provided</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-emerald-600">
                        ${order.total.toFixed(2)} USD
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={processingOrderId === order.orderId}
                              onClick={() => handleAcceptOrder(order)}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{processingOrderId === order.orderId ? 'Saving...' : 'Accept & Fulfill'}</span>
                            </button>
                            <button
                              type="button"
                              disabled={processingOrderId === order.orderId}
                              onClick={() => handleRejectOrder(order)}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>{processingOrderId === order.orderId ? 'Saving...' : 'Reject'}</span>
                            </button>
                          </div>
                        ) : isAccepted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Accepted &amp; Delivered
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" /> Rejected
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white/80 rounded-2xl border border-slate-200 p-6 space-y-2">
          <Clock className="w-10 h-10 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No orders found for filter "{filterStatus}"</p>
          <p className="text-xs text-slate-500">Customer orders will appear here in real time when submitted.</p>
        </div>
      )}

      {/* SECURITY MODAL: Confirm Database Order Wiping */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-5 animate-scaleUp">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-rose-600">
                <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="heading-font text-sm font-black text-slate-900">
                    Confirm Order Database Wiping
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Strict Security Verification
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning Body */}
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-900 space-y-1">
              <p className="text-xs font-bold flex items-center gap-1.5">
                <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                <span>PERMANENT ACTION WARNING</span>
              </p>
              <p className="text-[11px] font-semibold text-rose-700 leading-relaxed">
                Are you sure you want to delete ALL customer orders? This will permanently wipe orders from your Supabase database and local storage.
              </p>
            </div>

            {/* Password Input Form */}
            <form onSubmit={handleConfirmClearOrders} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Enter Admin Password to Authorize</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    placeholder="Enter admin password to confirm..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {clearError && (
                <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 text-xs font-extrabold flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{clearError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsClearModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Confirm & Wipe All Orders</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
