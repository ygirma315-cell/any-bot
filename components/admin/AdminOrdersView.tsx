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
        </div>
      </div>

      {/* Simulated Email Toast Alert */}
      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-md animate-bounce">
          <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
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
                className="p-5 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 space-y-4 shadow-sm transition-all hover:shadow-md hover:border-orange-200"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      {order.orderId}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{order.timestamp}</span>
                  </div>

                  <div>
                    {isPending && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                        <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" /> Pending Payment Review
                      </span>
                    )}
                    {isAccepted && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Accepted & Product Sent
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" /> Rejected
                      </span>
                    )}
                  </div>
                </div>

                {/* Customer Details Box & Pending Alert */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Customer Information Card */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Telegram Username:</span>
                      <strong className="text-orange-600 font-extrabold">{userHandle}</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Telegram User ID:</span>
                      <code className="font-mono text-slate-900 font-bold">{order.telegramUser.id}</code>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Payment Method:</span>
                      <strong className="text-slate-900 font-bold">{order.paymentMethod.name}</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 pt-1.5 border-t border-slate-200">
                      <span className="font-bold text-slate-700">Total Paid:</span>
                      <span className="heading-font text-sm font-extrabold text-emerald-600">${order.total.toFixed(2)} USD</span>
                    </div>
                  </div>

                  {/* Admin Action Notification Alert */}
                  <div className="p-3.5 bg-orange-50/70 rounded-xl border border-orange-200/80 space-y-2 text-xs flex flex-col justify-between">
                    <div className="space-y-1">
                      <p className="font-bold text-orange-950 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0" />
                        <span>Pending Payment Verification</span>
                      </p>
                      <p className="text-[11.5px] text-slate-700 leading-snug">
                        Telegram handle <strong className="text-slate-900">{userHandle}</strong> (ID: {order.telegramUser.id}) is waiting for payment confirmation. Accept or reject below.
                      </p>
                    </div>

                    {isAccepted && (
                      <div className="pt-2 text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                        <Send className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Product sent via email / Telegram (UI Simulation Active)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ordered Items Table */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Ordered Services</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{item.name} ×{item.quantity}</p>
                          <p className="text-[10px] text-emerald-600 font-semibold">{item.warranty}</p>
                        </div>
                        <span className="font-extrabold text-slate-900">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Accept / Reject Action Buttons */}
                {isPending && (
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleRejectOrder(order)}
                      className="flex-1 py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>Reject Payment</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAcceptOrder(order)}
                      className="flex-1 py-3 px-4 bg-[#FF6B00] hover:bg-[#E66000] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      <span>Accept Payment & Release Product</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
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
