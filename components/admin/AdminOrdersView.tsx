'use client';

import React, { useState, useEffect } from 'react';
import { OrderPayload } from '@/lib/bot';
import { getStoredOrders, updateOrderStatus } from '@/lib/store';
import { Clock, CheckCircle2, XCircle, User, Mail, Send, AlertTriangle, ShieldCheck, RefreshCw, Sparkles, Filter } from 'lucide-react';

export const AdminOrdersView: React.FC = () => {
  const [orders, setOrders] = useState<OrderPayload[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadOrders = () => {
    setOrders(getStoredOrders());
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
    
    setToastMessage(`✅ Order ${order.orderId} ACCEPTED! Product sent to ${userHandle} via email/Telegram (UI simulation).`);
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
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="heading-font text-lg font-extrabold text-white flex items-center gap-2">
            📦 Incoming Orders Management
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold animate-pulse">
                {pendingCount} Pending
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Review payment proof, verify user Telegram IDs, and release product credentials
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto overflow-x-auto">
          {['All', 'Pending', 'Accepted', 'Rejected'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                filterStatus === status
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}

          <button
            type="button"
            onClick={loadOrders}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white shrink-0"
            title="Refresh orders"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Simulated Email Toast Alert */}
      {toastMessage && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg animate-bounce">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Orders List */}
      {filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isPending = order.status === 'Pending' || order.status === 'Payment Submitted';
            const isAccepted = order.status === 'Accepted' || order.status === 'Completed' || order.status === 'Payment Confirmed';
            const isRejected = order.status === 'Rejected' || order.status === 'Cancelled';
            const userHandle = order.telegramUser.username ? `@${order.telegramUser.username}` : order.telegramUser.first_name;

            return (
              <div
                key={order.orderId}
                className="p-5 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 space-y-4 shadow-md transition-all hover:border-slate-700"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-extrabold text-white bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                      {order.orderId}
                    </span>
                    <span className="text-xs text-slate-400">{order.timestamp}</span>
                  </div>

                  <div>
                    {isPending && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                        <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" /> Pending Payment Review
                      </span>
                    )}
                    {isAccepted && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Accepted & Product Sent
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30">
                        <XCircle className="w-3.5 h-3.5 text-rose-400" /> Rejected
                      </span>
                    )}
                  </div>
                </div>

                {/* Customer Details Box & Pending Alert */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Customer Information Card */}
                  <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Telegram Username:</span>
                      <strong className="text-indigo-400 font-bold">{userHandle}</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Telegram User ID:</span>
                      <code className="font-mono text-slate-200">{order.telegramUser.id}</code>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Payment Method:</span>
                      <strong className="text-white">{order.paymentMethod.name}</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-700">
                      <span className="text-slate-400">Total Paid:</span>
                      <span className="heading-font text-sm font-extrabold text-emerald-400">${order.total.toFixed(2)} USD</span>
                    </div>
                  </div>

                  {/* Admin Action Notification Alert */}
                  <div className="p-3.5 bg-indigo-950/40 rounded-xl border border-indigo-500/30 space-y-2 text-xs flex flex-col justify-between">
                    <div className="space-y-1">
                      <p className="font-bold text-indigo-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Pending Payment Alert</span>
                      </p>
                      <p className="text-[11.5px] text-slate-300 leading-snug">
                        Telegram handle <strong className="text-white">{userHandle}</strong> (ID: {order.telegramUser.id}) has submitted payment for this order. Accept or reject below.
                      </p>
                    </div>

                    {isAccepted && (
                      <div className="pt-2 text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                        <Send className="w-3.5 h-3.5" />
                        <span>Product sent via email / Telegram (UI Simulation Active)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ordered Items Table */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Ordered Services</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-white">{item.name} ×{item.quantity}</p>
                          <p className="text-[10px] text-emerald-400 font-semibold">{item.warranty}</p>
                        </div>
                        <span className="font-extrabold text-slate-200">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Accept / Reject Action Buttons */}
                {isPending && (
                  <div className="pt-3 border-t border-slate-800 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleRejectOrder(order)}
                      className="flex-1 py-3 px-4 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4 text-rose-400" />
                      <span>Reject Payment</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAcceptOrder(order)}
                      className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold shadow-lg hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Accept Payment & Send Product</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-900/60 rounded-2xl border border-slate-800 p-6 space-y-2">
          <Clock className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No orders found for filter "{filterStatus}"</p>
          <p className="text-xs text-slate-500">New customer orders will appear here as soon as they submit payment.</p>
        </div>
      )}
    </div>
  );
};
