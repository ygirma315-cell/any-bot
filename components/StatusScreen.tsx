'use client';

import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, ShoppingBag, ShieldCheck, ShieldAlert, Sparkles, RefreshCw, Mail, User } from 'lucide-react';
import { getStoredOrders } from '@/lib/store';
import { OrderPayload } from '@/lib/bot';
import { triggerHaptic } from '@/lib/telegram';

interface StatusScreenProps {
  onBrowseServices: () => void;
}

export const StatusScreen: React.FC<StatusScreenProps> = ({ onBrowseServices }) => {
  const [orders, setOrders] = useState<OrderPayload[]>([]);

  const loadOrders = () => {
    setOrders(getStoredOrders());
  };

  useEffect(() => {
    loadOrders();

    const handleOrdersUpdate = () => loadOrders();
    window.addEventListener('ai_store_orders_updated', handleOrdersUpdate);

    return () => {
      window.removeEventListener('ai_store_orders_updated', handleOrdersUpdate);
    };
  }, []);

  if (orders.length === 0) {
    return (
      <div className="px-4 py-12 flex flex-col items-center justify-center text-center space-y-5 min-h-[60vh]">
        <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-slate-100 via-indigo-50 to-blue-50 p-[2px] shadow-sm flex items-center justify-center">
          <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center relative overflow-hidden">
            <Clock className="w-10 h-10 text-slate-300 relative z-10" />
            <Sparkles className="w-4 h-4 text-indigo-400 absolute top-3 right-3 animate-pulse" />
          </div>
        </div>

        <div>
          <h2 className="heading-font text-lg font-bold text-slate-900">No active orders yet</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
            When you purchase a subscription and submit payment, your order status will appear here in real-time.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onBrowseServices();
          }}
          className="btn-pill btn-pill-action px-6 py-3 text-xs font-bold shadow-md"
        >
          <ShoppingBag className="w-4 h-4 text-indigo-500" />
          <span>Browse Services</span>
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="heading-font text-lg font-bold text-slate-900">MY ORDER STATUS</h2>
          <p className="text-xs text-slate-500">Live order tracking & delivery verification</p>
        </div>
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            loadOrders();
          }}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 shadow-xs flex items-center gap-1 text-xs"
          title="Refresh orders"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-4">
        {orders.map((order) => {
          const isPending = order.status === 'Pending' || order.status === 'Payment Submitted';
          const isAccepted = order.status === 'Accepted' || order.status === 'Completed' || order.status === 'Payment Confirmed';
          const isRejected = order.status === 'Rejected' || order.status === 'Cancelled';

          return (
            <div
              key={order.orderId}
              className="p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm space-y-3 relative overflow-hidden"
            >
              {/* Header Status Badge */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Order ID</span>
                  <p className="font-mono text-xs font-bold text-slate-900">{order.orderId}</p>
                </div>

                <div>
                  {isPending && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200/80 animate-pulse">
                      <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Admin Approval
                    </span>
                  )}
                  {isAccepted && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200/80">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Payment Accepted & Sent
                    </span>
                  )}
                  {isRejected && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-200/80">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" /> Rejected / Cancelled
                    </span>
                  )}
                </div>
              </div>

              {/* Order User info */}
              <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{order.telegramUser.username ? `@${order.telegramUser.username}` : order.telegramUser.first_name}</span>
                </div>
                <span className="text-[10.5px] text-slate-400">{order.timestamp}</span>
              </div>

              {/* Product items */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tight">Ordered Products</span>
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 bg-slate-50/70 rounded-lg">
                    <span className="font-semibold text-slate-800">{item.name} <span className="text-slate-500">×{item.quantity}</span></span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-emerald-600 font-semibold">{item.warranty}</span>
                      <span className="font-bold text-slate-900">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total & Payment Method */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500 font-medium">Method: <strong className="text-slate-800">{order.paymentMethod.name}</strong></span>
                <span className="heading-font text-sm font-extrabold text-indigo-600">Total: ${order.total.toFixed(2)}</span>
              </div>

              {/* Status Message Info Notice */}
              {isPending && (
                <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/60 text-xs text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    ⏳ Payment Pending Admin Review
                  </p>
                  <p className="text-[11px] text-amber-800 leading-snug">
                    Your payment notification for Telegram handle <strong className="text-amber-950">@{order.telegramUser.username}</strong> has been sent to our admin dashboard. Once verified, your product credentials will be released instantly!
                  </p>
                </div>
              )}

              {isAccepted && (
                <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200/60 text-xs text-emerald-900 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    🎉 Payment Accepted & Service Delivered!
                  </p>
                  <p className="text-[11px] text-emerald-800 leading-snug">
                    Admin has approved your payment! Product details & access link have been dispatched to your Telegram chat/email. Thank you for buying from AnyAi STORE!
                  </p>
                </div>
              )}

              {isRejected && (
                <div className="p-3 bg-rose-50/80 rounded-xl border border-rose-200/60 text-xs text-rose-900 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    ❌ Order Payment Rejected
                  </p>
                  <p className="text-[11px] text-rose-800 leading-snug">
                    The admin could not confirm payment for this transaction. Please verify your payment reference and contact support.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
