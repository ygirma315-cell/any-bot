'use client';

import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, ShoppingBag, ShieldCheck, ShieldAlert, Sparkles, RefreshCw, Mail, User } from 'lucide-react';
import { getStoredOrders, fetchOrdersFromSupabase } from '@/lib/store';
import { OrderPayload } from '@/lib/bot';
import { triggerHaptic } from '@/lib/telegram';

interface StatusScreenProps {
  onBrowseServices: () => void;
}

export const StatusScreen: React.FC<StatusScreenProps> = ({ onBrowseServices }) => {
  const [orders, setOrders] = useState<OrderPayload[]>([]);

  const loadOrders = () => {
    setOrders(getStoredOrders());
    fetchOrdersFromSupabase().then((data) => {
      if (data && data.length > 0) setOrders(data);
    });
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
      <div className="px-4 py-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[60vh] animate-fadeIn">
        {/* Premium Glowing Icon Container */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-purple-500/30 via-indigo-500/20 to-pink-500/30 blur-xl animate-pulse" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 p-0.5 shadow-xl flex items-center justify-center">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center relative overflow-hidden">
              <ShoppingBag className="w-9 h-9 text-purple-300 stroke-[2.2]" />
              <Sparkles className="w-4 h-4 text-amber-400 absolute top-2 right-2 animate-bounce" />
            </div>
          </div>
        </div>

        <div className="space-y-1.5 max-w-xs mx-auto">
          <h2 className="heading-font text-lg font-extrabold text-slate-900">No Active Orders Yet</h2>
          <p className="text-xs font-semibold text-slate-500 leading-relaxed">
            When you purchase a subscription and submit payment, your order status will appear here in real-time.
          </p>
        </div>

        {/* High-Vibe Solid Purple CTA Button */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onBrowseServices();
          }}
          className="px-7 py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-700 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-purple-600/25 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4 text-white stroke-[2.5]" />
          <span className="tracking-wide">Browse Services</span>
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4 pb-28">
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

              {/* Order User & Delivery Email info */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-extrabold text-slate-900">
                    <User className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{order.telegramUser.username ? `@${order.telegramUser.username}` : order.telegramUser.first_name}</span>
                  </div>
                  <span className="text-[10.5px] text-slate-400 font-semibold">{order.timestamp}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 pt-1 border-t border-slate-200/60">
                  <Mail className="w-3.5 h-3.5 text-[#FF6B00] shrink-0" />
                  <span>Delivery Email: <strong className="text-slate-900 font-bold">{order.deliveryEmail || (order.telegramUser.username ? `${order.telegramUser.username}@example.com` : 'customer@example.com')}</strong></span>
                </div>
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
                <div className="p-3.5 bg-emerald-50/90 rounded-2xl border border-emerald-200/80 text-xs text-emerald-950 space-y-2">
                  <p className="font-extrabold text-emerald-900 flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>🎉 Congrats!</span>
                  </p>
                  <p className="text-[11.5px] text-emerald-900 font-medium leading-relaxed">
                    Congrats! You can check your <strong className="text-emerald-950 font-bold underline">{order.telegramUser.username || 'email'}</strong> email. We've sent your subscription. Have a nice time!
                  </p>
                  <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                    <span className="text-[10px] text-emerald-700 font-medium">Delivered to registered email</span>
                    <a
                      href="https://t.me/exo80"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-[#FF6B00] transition-colors underline"
                    >
                      <span>If any problem, Contact Support (@exo80)</span>
                    </a>
                  </div>
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
