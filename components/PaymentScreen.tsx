'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { PAYMENT_METHODS, PaymentMethod } from '@/config/payments';
import { Product } from '@/config/products';
import { getTelegramUser, triggerHaptic } from '@/lib/telegram';
import { addOrder } from '@/lib/store';
import { OrderPayload } from '@/lib/bot';
import { Copy, Check, ShieldCheck, ShieldAlert, CheckCircle2, Loader2, Sparkles, Mail, Send, Lock, FileText, Info } from 'lucide-react';

interface PaymentScreenProps {
  cart: { product: Product; quantity: number }[];
  userEmail: string;
  onOrderCompleted: () => void;
  onBrowseServices: () => void;
  onViewStatus?: () => void;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({
  cart,
  userEmail,
  onOrderCompleted,
  onBrowseServices,
  onViewStatus
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(PAYMENT_METHODS[0]);
  const [copied, setCopied] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [submittedOrder, setSubmittedOrder] = useState<{
    orderId: string;
    timestamp: string;
  } | null>(null);

  const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Protection Guard: If user jumps directly to Payment without selecting products
  if (cart.length === 0 && !submittedOrder) {
    return (
      <div className="px-4 py-12 flex flex-col items-center justify-center text-center space-y-5 min-h-[60vh] animate-fadeIn">
        <div className="w-20 h-20 rounded-3xl bg-orange-50 border-2 border-orange-200 flex items-center justify-center text-[#FF6B00] shadow-sm">
          <Info className="w-10 h-10 animate-bounce" />
        </div>

        <div className="space-y-2 max-w-sm">
          <span className="inline-block px-3 py-1 rounded-full bg-orange-100 text-[#FF6B00] font-extrabold text-xs">
            Product Selection Required
          </span>
          <h2 className="heading-font text-lg font-extrabold text-slate-900">
            No Product Selected
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed font-semibold">
            First you should order or choose a product that you are going to pay for.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onBrowseServices();
          }}
          className="btn-pill btn-pill-primary px-7 py-3.5 text-xs font-extrabold shadow-md hover:shadow-lg bg-[#FF6B00] text-white flex items-center gap-2"
        >
          <span>Browse Products to Order</span>
        </button>
      </div>
    );
  }

  const handleCopyAccount = (text: string) => {
    triggerHaptic('light');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaidSubmit = async () => {
    if (!selectedMethod || cart.length === 0) return;

    if (!userEmail.trim()) {
      alert('Delivery email is missing. Please return to the Order screen and enter your email.');
      return;
    }

    triggerHaptic('heavy');
    setIsSubmitting(true);

    try {
      const { user } = getTelegramUser();

      const updatedTelegramUser = {
        id: user.id || 987654321,
        username: user.username || userEmail.split('@')[0] || 'customer',
        first_name: user.first_name || 'Customer',
        last_name: user.last_name || ''
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
          warranty: item.product.isWarranty !== false ? (item.product.warranty || 'Warranty Included') : 'No Warranty'
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
        // backend notification optional
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
            <Sparkles className="w-3.5 h-3.5" /> Order Submitted & Processing
          </div>
          <h2 className="heading-font text-xl font-extrabold text-slate-900">
            Order Submitted!
          </h2>
          <p className="text-xs text-slate-600 max-w-xs mx-auto mt-1 leading-relaxed">
            Congrats! You can check your <strong className="text-slate-900 font-bold underline">{userEmail}</strong> email. We've sent your subscription. Have a nice time!
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
              Pending Admin Verification
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Delivery Email:</span>
            <span className="font-bold text-slate-900">{userEmail}</span>
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
              className="btn-pill btn-pill-primary py-3 text-xs font-bold shadow-md bg-[#FF6B00] text-white"
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

        <div className="pt-2 text-center">
          <a
            href="https://t.me/AnyAi_Support"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-[#FF6B00] transition-colors underline"
          >
            <span>If any problem with your order, Contact Us</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4 pb-12">
      <div>
        <h2 className="heading-font text-lg font-bold text-slate-900">PAYMENT DETAILS</h2>
        <p className="text-xs text-slate-500">Confirm delivery email & choose payment method</p>
      </div>

      {/* Non-Editable Customer & Delivery Information Card */}
      <div className="p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
            <Mail className="w-4 h-4 text-[#FF6B00]" /> Customer & Delivery Info
          </span>
          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/80 flex items-center gap-1">
            <Lock className="w-3 h-3 text-slate-400" /> Read-Only Info
          </span>
        </div>

        <div className="space-y-2 text-xs">
          {/* Telegram Name & Username Fetched */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Telegram Name</span>
              <span className="font-extrabold text-slate-900 truncate block">
                {getTelegramUser().user.first_name} {getTelegramUser().user.last_name || ''}
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Telegram Handle</span>
              <span className="font-extrabold text-orange-600 truncate block">
                @{getTelegramUser().user.username || 'user'}
              </span>
            </div>
          </div>

          {/* Delivery Email Destination */}
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 font-mono text-xs font-bold text-slate-900 flex items-center justify-between">
            <div className="truncate pr-2">
              <span className="text-[10px] font-bold text-slate-400 block font-sans uppercase">Delivery Destination</span>
              <span>{userEmail || 'No email provided'}</span>
            </div>
            <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-1 rounded shrink-0">
              Credentials Target
            </span>
          </div>
        </div>
      </div>

      {/* Short Updated Payment Rules Card */}
      <div className="p-3.5 bg-orange-50/70 rounded-2xl border border-orange-200/70 text-xs space-y-1.5">
        <p className="font-extrabold text-orange-950 flex items-center gap-1">
          <FileText className="w-4 h-4 text-[#FF6B00]" /> Payment & Refund Policy:
        </p>
        <div className="space-y-1 text-[11px] text-slate-700 leading-snug">
          <p>• <strong>1 Product = 1 Email:</strong> Each email address can only be used once per product.</p>
          <p>• <strong>Warranty Products:</strong> Refunds & replacements are valid <strong>ONLY up to the specified warranty period</strong>.</p>
          <p>• <strong>Non-Warranty Products:</strong> Strictly <strong>NO REFUNDS</strong> or replacements for non-warranty items.</p>
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
                  ? 'bg-white/95 backdrop-blur-md border-[#FF6B00] shadow-md ring-2 ring-[#FF6B00]/10'
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
                    isSelected ? 'border-[#FF6B00] bg-[#FF6B00] text-white' : 'border-slate-300'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>

              {isSelected && (
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="text-xs font-medium text-slate-600">Amount to Transfer:</span>
                    <span className="heading-font text-base font-extrabold text-[#FF6B00]">
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

                  <div className="space-y-1 bg-orange-50/50 p-3 rounded-xl border border-orange-100">
                    <p className="text-[11px] font-bold text-orange-950 mb-1">Payment Instructions:</p>
                    {method.instructions.map((step, idx) => (
                      <p key={idx} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                        <span className="font-bold text-[#FF6B00]">{idx + 1}.</span>
                        <span>{step}</span>
                      </p>
                    ))}
                  </div>

                  {/* Submit Payment CTA Button */}
                  <button
                    type="button"
                    disabled={isSubmitting || cart.length === 0}
                    onClick={handlePaidSubmit}
                    className="btn-pill btn-pill-primary w-full py-4 text-xs font-extrabold shadow-md hover:shadow-lg flex items-center justify-center gap-2 bg-[#FF6B00] hover:bg-[#E66000] text-white transition-all transform active:scale-95"
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
