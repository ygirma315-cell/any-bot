'use client';

import React, { useState, useEffect } from 'react';
import { OrderPayload } from '@/lib/bot';
import { getStoredOrders, updateOrderStatus, clearAllOrders, fetchOrdersFromSupabase } from '@/lib/store';
import { Clock, CheckCircle2, XCircle, User, Mail, Send, AlertTriangle, ShieldCheck, RefreshCw, Sparkles, Filter, Trash2 } from 'lucide-react';

export const AdminOrdersView: React.FC = () => {
  const [orders, setOrders] = useState<OrderPayload[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadOrders = () => {
    setOrders(getStoredOrders());
    fetchOrdersFromSupabase().then((data) => {
      if (data && data.length > 0) setOrders(data);
    });
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all order history? This will delete all order logs.')) {
      clearAllOrders();
      loadOrders();
      setToastMessage('🗑️ All order history cleared!');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  useEffect(() => {
    loadOrders();
    const handleUpdate = () => loadOrders();
    window.addEventListener('ai_store_orders_updated', handleUpdate);
    return () => window.removeEventListener('ai_store_orders_updated', handleUpdate);
  }, []);


  const handleAcceptOrder = (order: OrderPayload) => {
    updateOrderStatus(order.orderId, 'Accepted');
    const userHandle = order.telegramUser.username ? `@${order.telegramUser.username}` : order.telegramUser.first_name;
    
    setToastMessage(`✅ Order ${order.orderId} ACCEPTED! Product credentials released to ${userHandle} via email/Telegram (UI simulation active).`);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleRejectOrder = (order: OrderPayload) => {
    updateOrderStatus(order.orderId, 'Rejected');
    setToastMessage(`❌ Order ${order.orderId} REJECTED.`);
    setTimeout(() => setToastMessage(null), 3000);
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
            onClick={loadOrders}
            className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 shrink-0"
            title="Refresh orders"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleClearHistory}
            className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 text-xs font-bold transition-all shrink-0 flex items-center gap-1"
            title="Clear all orders history"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Orders</span>
          </button>
        </div>
      </div>

      {/* Simulated Email Toast Alert */}
      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-md animate-bounce">
          <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Orders Table */}
      {filteredOrders.length > 0 ? (
        <div className="p-5 bg-white/95 rounded-2xl border border-slate-200/90 space-y-4 shadow-sm">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-100 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">ITEM / PRODUCT</th>
                  <th className="py-3 px-3">TELEGRAM USERNAME</th>
                  <th className="py-3 px-3">TELEGRAM ID</th>
                  <th className="py-3 px-3">DELIVERY EMAIL</th>
                  <th className="py-3 px-3">PRICE</th>
                  <th className="py-3 px-3 text-right">STATUS / ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredOrders.map((order) => {
                  const isPending = order.status === 'Pending' || order.status === 'Payment Submitted';
                  const isAccepted = order.status === 'Accepted' || order.status === 'Completed' || order.status === 'Payment Confirmed';
                  const isRejected = order.status === 'Rejected' || order.status === 'Cancelled';
                  const userHandle = order.telegramUser.username ? `@${order.telegramUser.username}` : 'No handle';
                  const deliveryEmail = order.deliveryEmail || (order.telegramUser.username ? `${order.telegramUser.username}@example.com` : 'customer@example.com');

                  return (
                    <tr key={order.orderId} className="hover:bg-slate-50/80 transition-colors">
                      {/* 1. Item / Product */}
                      <td className="py-3.5 px-3">
                        <span className="font-extrabold text-slate-900 block truncate max-w-[200px]">
                          {order.items.map(i => `${i.name} (×${i.quantity})`).join(', ')}
                        </span>
                        <span className="font-mono text-[10.5px] text-slate-400 font-semibold block">{order.orderId}</span>
                      </td>

                      {/* 2. Telegram Username */}
                      <td className="py-3.5 px-3">
                        {order.telegramUser.username ? (
                          <span className="font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                            {userHandle}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-semibold">{userHandle}</span>
                        )}
                      </td>

                      {/* 3. Telegram ID */}
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-800">
                        <code>{order.telegramUser.id}</code>
                      </td>

                      {/* 4. Delivery Email Address */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1 font-mono font-bold text-slate-900">
                          <Mail className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                          <span className="truncate max-w-[180px]">{deliveryEmail}</span>
                        </div>
                      </td>

                      {/* 5. Total Price */}
                      <td className="py-3.5 px-3">
                        <span className="font-black text-emerald-600">${order.total.toFixed(2)} USD</span>
                      </td>

                      {/* 6. Status / Action (Accept / Reject) */}
                      <td className="py-3.5 px-3 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleAcceptOrder(order)}
                              className="px-2.5 py-1.5 bg-[#FF6B00] hover:bg-[#E66000] text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Accept</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectOrder(order)}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : isAccepted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Accepted
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
    </div>
  );
};
