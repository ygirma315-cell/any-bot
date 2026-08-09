'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { PAYMENT_METHODS, PaymentMethod } from '@/config/payments';
import { Product } from '@/config/products';
import { getTelegramUser, triggerHaptic } from '@/lib/telegram';
import { addOrder } from '@/lib/store';
import { OrderPayload } from '@/lib/bot';
import { Copy, Check, ShieldCheck, CheckCircle2, Loader2, Sparkles, User, Mail, Send } from 'lucide-react';

interface PaymentScreenProps {
  cart: { product: Product; quantity: number }[];
  onOrderCompleted: () => void;
  onBrowseServices: () => void;
  onViewStatus?: () => void;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({
  cart,
  onOrderCompleted,
  onBrowseServices,
  onViewStatus
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(PAYMENT_METHODS[0]);
  const [copied, setCopied] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // User details input states
  const [telegramUsername, setTelegramUsername] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');

  const [submittedOrder, setSubmittedOrder] = useState<{
    orderId: string;
    timestamp: string;
  } | null>(null);

  useEffect(() => {
    const { user } = getTelegramUser();
    if (user?.username) {
      setTelegramUsername(user.username.startsWith('@') ? user.username : `@${user.username}`);
    }
  }, []);

  const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleCopyAccount = (text: string) => {
    triggerHaptic('light');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaidSubmit = async () => {
    if (!selectedMethod || cart.length === 0) return;

    if (!telegramUsername.trim()) {
      alert('Please enter your Telegram Username before submitting payment.');
      return;
    }

    triggerHaptic('heavy');
    setIsSubmitting(true);

    try {
      const { user } = getTelegramUser();
      const cleanUsername = telegramUsername.trim().replace(/^@/, '');

      const updatedTelegramUser = {
        ...user,
        username: cleanUsername,
        first_name: user.first_name || cleanUsername || 'Customer'
      };

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const generatedOrderId = `ORD-${dateStr}-${randomSuffix}`;
      const orderTimestamp = new Date().toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short' }) + ' UTC';

      const payload: OrderPayload = {
        orderId: generatedOrderId,
        telegramUser: updatedTelegramUser,
        items: cart.map((item) => ({
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          warranty: item.product.warranty || '20 Days Warranty'
        })),
        subtotal: totalAmount,
        total: totalAmount,
        paymentMethod: {
          id: selectedMethod.id,
          name: selectedMethod.name,
          accountName: selectedMethod.accountName,
          accountId: selectedMethod.accountId
        },
        timestamp: orderTimestamp,
        status: 'Pending'
      };

      // Save locally to shared store so status screen and admin view update instantly
      addOrder(payload);

      // Submit order via backend API
      try {
        await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch {
        // backend api notification optional
      }

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore confetti fallback
      }

      setSubmittedOrder({
        orderId: generatedOrderId,
        timestamp: orderTimestamp
      });
      onOrderCompleted();
    } catch (err) {
      console.error('Payment submission error:', err);
      alert('Error submitting payment notification. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedOrder) {
    return (
      <div className="px-4 py-8 space-y-6 text-center animate-fadeIn pb-12">
        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100/80 border-4 border-emerald-200 flex items-center justify-center text-emerald-600 shadow-lg">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Payment Notification Received
          </div>
          <h2 className="heading-font text-xl font-extrabold text-slate-900">
            Order Submitted!
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
            Our admin team is verifying your payment for handle <span className="font-bold text-indigo-600">{telegramUsername}</span>. Track status live under the Status tab!
          </p>
        </div>

        <div className="p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 text-left space-y-2 text-xs shadow-xs">
          <div className="flex justify-between text-slate-600">
            <span>Order Number:</span>
            <span className="font-mono font-bold text-slate-900">{submittedOrder.orderId}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Status:</span>
            <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/50">
              Pending Admin Acceptance
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Telegram User:</span>
            <span className="font-bold text-slate-800">{telegramUsername}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Time:</span>
            <span className="text-slate-800">{submittedOrder.timestamp}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {onViewStatus && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setSubmittedOrder(null);
                onViewStatus();
              }}
              className="btn-pill btn-pill-primary py-3 text-xs font-bold shadow-md"
            >
              Track Order Status
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setSubmittedOrder(null);
              onBrowseServices();
            }}
            className="btn-pill btn-pill-action py-3 text-xs font-bold shadow-md"
          >
            Back to Store
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4 pb-12">
      <div>
        <h2 className="heading-font text-lg font-bold text-slate-900">SELECT PAYMENT METHOD</h2>
        <p className="text-xs text-slate-500">Choose payment method & enter your details</p>
      </div>

      {/* User Telegram Username & Email Input Form */}
      <div className="p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-indigo-100 shadow-sm space-y-3">
        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
          <User className="w-4 h-4 text-indigo-600" /> Customer Information
        </h3>

        <div>
          <label className="text-[11px] font-bold text-slate-600 block mb-1">
            Telegram Username <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={telegramUsername}
              onChange={(e) => setTelegramUsername(e.target.value)}
              placeholder="@username"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-600 block mb-1">
            Email Address <span className="text-slate-400 font-normal">(Optional for delivery)</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Payment Methods List */}
      <div className="space-y-2.5">
        {PAYMENT_METHODS.map((method) => {
          const isSelected = selectedMethod?.id === method.id;
          return (
            <div
              key={method.id}
              onClick={() => {
                triggerHaptic('light');
                setSelectedMethod(method);
              }}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-300 relative overflow-hidden ${
                isSelected
                  ? 'bg-white/95 backdrop-blur-md border-indigo-500 shadow-md ring-2 ring-indigo-500/10'
                  : 'bg-white/80 backdrop-blur-md border-slate-200/80 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 relative rounded-xl overflow-hidden p-1.5 border border-slate-100 bg-white shadow-xs flex items-center justify-center shrink-0">
                    <Image
                      src={method.logoPath}
                      alt={method.name}
                      width={36}
                      height={36}
                      className="object-contain w-full h-full"
                    />
                  </div>
                  <div>
                    <h3 className="heading-font text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      {method.name}
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {method.badge}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500">{method.subtitle}</p>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>

              {isSelected && (
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="text-xs font-medium text-slate-600">Amount to Transfer:</span>
                    <span className="heading-font text-base font-extrabold text-indigo-600">
                      ${totalAmount.toFixed(2)} USD
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight block mb-1">
                      Send Payment To ({method.accountName}):
                    </label>
                    <div className="flex items-center justify-between p-2.5 bg-slate-900 text-white rounded-xl font-mono text-xs shadow-xs">
                      <span className="truncate pr-2">{method.accountId}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyAccount(method.accountId);
                        }}
                        className="btn-pill text-[10px] py-1 px-2.5 bg-white/10 hover:bg-white/20 text-white border-white/20 shrink-0"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                    <p className="text-[11px] font-bold text-indigo-900 mb-1">Instructions:</p>
                    {method.instructions.map((step, idx) => (
                      <p key={idx} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                        <span className="font-bold text-indigo-600">{idx + 1}.</span>
                        <span>{step}</span>
                      </p>
                    ))}
                  </div>

                  {/* Submit Payment CTA Button */}
                  <button
                    type="button"
                    disabled={isSubmitting || cart.length === 0}
                    onClick={handlePaidSubmit}
                    className="btn-pill btn-pill-primary w-full py-4 text-xs font-extrabold shadow-lg hover:shadow-xl flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white transition-all transform active:scale-95"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Submitting Payment...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-white" />
                        <span>Submit Payment (I've Paid)</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
