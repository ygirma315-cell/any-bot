import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { PaymentMethod } from '@/config/payments';
import { Product } from '@/config/products';
import { getTelegramUser, triggerHaptic } from '@/lib/telegram';
import { addOrder, getStoredPaymentMethods, fetchPaymentMethodsFromSupabase } from '@/lib/store';
import { OrderPayload } from '@/lib/bot';
import { Copy, Check, ShieldCheck, ShieldAlert, CheckCircle2, Loader2, Sparkles, Mail, Send, Lock, FileText, Info, Wallet, ShoppingBag } from 'lucide-react';

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
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [dbStatus, setDbStatus] = useState<'checking' | 'available' | 'down'>('checking');

  const [submittedOrder, setSubmittedOrder] = useState<{
    orderId: string;
    timestamp: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const res = await fetch('/api/health');
        const body = await res.json().catch(() => ({}));
        if (!isMounted) return;
        if (body.ok === true) {
          setDbStatus('available');
          const data = await fetchPaymentMethodsFromSupabase();
          if (data && data.length > 0) {
            setMethods(data);
            if (!selectedMethod && data.length > 0) {
              setSelectedMethod(data[0]);
            }
          }
        } else {
          setDbStatus('down');
          setMethods([]);
        }
      } catch {
        if (isMounted) {
          setDbStatus('down');
          setMethods([]);
        }
      }
    })();

    const handleUpdate = () => {
      const updated = getStoredPaymentMethods();
      setMethods(updated);
      if (updated.length > 0 && !selectedMethod) {
        setSelectedMethod(updated[0]);
      }
    };

    window.addEventListener('ai_store_payments_updated', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('ai_store_payments_updated', handleUpdate);
    };
  }, []);

  const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleCopyAccount = (text: string) => {
    triggerHaptic('light');
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePaidSubmit = async () => {
    if (!selectedMethod || cart.length === 0) return;

    if (dbStatus !== 'available') {
      alert('Payment methods are not available right now because the database is not working. Please try again later.');
      return;
    }

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

      const orderTimestamp = new Date().toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short' }) + ' UTC';

      const payload: OrderPayload = {
        orderId: '', // server assigns the real sequential ID
        deliveryEmail: userEmail.trim(),
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

      let dbSaved = false;
      let serverOrderId = '';
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const body = await res.json().catch(() => ({}));
          if (res.ok && body.dbSaved === true) {
            dbSaved = true;
            if (body.orderId) serverOrderId = body.orderId;
            break;
          }
        } catch {
          // retry below
        }
        if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }

      if (!dbSaved) {
        alert('Payment methods are not available right now because the database is not working. Please try again later.');
        return;
      }

      payload.orderId = serverOrderId;
      addOrder(payload);

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
        orderId: serverOrderId,
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
      <div className="max-w-lg mx-auto px-4 py-12 space-y-6 text-center animate-fadeIn pb-28">
        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100/80 border-4 border-emerald-200 flex items-center justify-center text-emerald-600 shadow-lg">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Order Submitted &amp; Processing
          </div>
          <h2 className="heading-font text-xl font-extrabold text-slate-900">
            Order Submitted!
          </h2>
          <p className="text-xs text-slate-600 max-w-xs mx-auto mt-1 leading-relaxed">
            Congrats! You can check your <strong className="text-slate-900 font-bold underline">{userEmail}</strong> email. We&apos;ve sent your subscription. Have a nice time!
          </p>
        </div>

        <div className="p-5 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 text-left space-y-2.5 text-xs shadow-xs">
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

        <div className="grid grid-cols-2 gap-3">
          {onViewStatus && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setSubmittedOrder(null);
                onViewStatus();
              }}
              className="py-3.5 px-4 rounded-xl text-xs font-extrabold shadow-md bg-[#FF6B00] text-white hover:bg-[#E66000] transition active:scale-95"
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
            className="py-3.5 px-4 rounded-xl text-xs font-extrabold shadow-sm bg-slate-100 hover:bg-slate-200 text-slate-800 transition active:scale-95"
          >
            Back to Store
          </button>
        </div>

        <div className="pt-2 text-center">
          <a
            href="https://t.me/exo80"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-[#FF6B00] transition-colors underline"
          >
            <span>If any problem with your order, Contact Support (@exo80)</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-5 pb-28 animate-fadeIn">
      <div>
        <h2 className="heading-font text-lg sm:text-xl font-bold text-slate-900">PAYMENT DETAILS</h2>
        <p className="text-xs text-slate-500">
          {cart.length > 0 ? 'Select your preferred payment method & complete checkout' : 'Supported payment methods overview'}
        </p>
      </div>

      {/* Database Availability Banner */}
      {dbStatus === 'checking' && (
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 font-semibold flex items-center gap-2 animate-fadeIn">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500 shrink-0" />
          <span>Checking payment methods availability&hellip;</span>
        </div>
      )}
      {dbStatus === 'down' && (
        <div className="p-4 bg-rose-50/90 rounded-2xl border-2 border-rose-300 text-xs space-y-1.5 animate-fadeIn">
          <p className="font-extrabold text-rose-900 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Payment methods are not available</span>
          </p>
          <p className="text-[11.5px] font-semibold text-rose-800 leading-relaxed">
            The store database is temporarily unavailable. Please try again later.
          </p>
        </div>
      )}

      {/* Prompt Banner when cart is empty */}
      {cart.length === 0 && (
        <div className="p-6 bg-indigo-50/90 backdrop-blur-md rounded-2xl border-2 border-indigo-200/80 space-y-3 shadow-xs text-center animate-fadeIn max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-white border border-indigo-200 shadow-sm flex items-center justify-center text-indigo-600 mx-auto">
            <Wallet className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h3 className="heading-font text-base font-extrabold text-slate-900">No Product Selected</h3>
            <p className="text-xs font-semibold text-slate-600 leading-relaxed">
              First please choose a product in the store. You can preview our supported payment methods below:
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onBrowseServices();
            }}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mx-auto active:scale-95"
          >
            <ShoppingBag className="w-4 h-4 text-white stroke-[2.5]" />
            <span>Browse Products to Order</span>
          </button>
        </div>
      )}

      {/* Responsive 2-Column Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Delivery Email & Compact Payment Method Grid (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Delivery Email Summary */}
          {cart.length > 0 && (
            <div className="p-3.5 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF6B00] shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Delivery Email</span>
                  <p className="text-xs font-black text-slate-900 truncate">{userEmail || 'No email entered'}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold flex items-center gap-1 shrink-0">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Instant Delivery
              </span>
            </div>
          )}

          {/* Compact Side-by-Side Payment Methods Grid */}
          <div className="p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-[#FF6B00]" /> Select Payment Method:
              </h3>
              {selectedMethod && (
                <span className="text-[10.5px] font-extrabold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
                  {selectedMethod.name}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {methods.map((method) => {
                const isSelected = selectedMethod?.id === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedMethod(method);
                    }}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all duration-200 text-center relative ${
                      isSelected
                        ? 'bg-orange-50/60 border-[#FF6B00] shadow-md ring-2 ring-[#FF6B00]/20 scale-102'
                        : 'bg-slate-50/80 hover:bg-slate-100/80 border-slate-200 text-slate-700'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#FF6B00] text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                    <div className="w-10 h-10 rounded-xl bg-white p-1.5 border border-slate-200/80 shadow-xs flex items-center justify-center shrink-0">
                      <Image
                        src={method.logoPath}
                        alt={method.name}
                        width={32}
                        height={32}
                        className="object-contain w-full h-full"
                      />
                    </div>
                    <span className={`text-[11px] font-extrabold line-clamp-1 ${
                      isSelected ? 'text-[#FF6B00]' : 'text-slate-800'
                    }`}>
                      {method.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment & Refund Policy */}
          {cart.length > 0 && (
            <div className="p-3 bg-orange-50/60 rounded-2xl border border-orange-200/70 text-xs space-y-1">
              <p className="font-extrabold text-orange-950 flex items-center gap-1 text-[11.5px]">
                <FileText className="w-3.5 h-3.5 text-[#FF6B00]" /> Payment &amp; Warranty Policy:
              </p>
              <div className="space-y-0.5 text-[11px] text-slate-700 leading-tight">
                <p>• Credentials and access links are delivered to your email upon confirmation.</p>
                <p>• Warranty replacements are active for the duration indicated per product.</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Transfer Details & Submit CTA (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-4">
          {selectedMethod && (
            <div className="p-4 sm:p-5 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-md space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <span className="text-xs font-black text-slate-900 uppercase">Transfer Details</span>
                <span className="text-xs font-extrabold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                  {selectedMethod.name}
                </span>
              </div>

              {cart.length > 0 ? (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-xs font-semibold text-slate-600">Total Amount:</span>
                  <span className="heading-font text-xl font-black text-[#FF6B00]">
                    ${totalAmount.toFixed(2)} USD
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs font-semibold text-indigo-900">
                  <span>Order Status:</span>
                  <span className="text-indigo-600 font-extrabold">No product selected</span>
                </div>
              )}

              {/* Clean Account Number / Address Copy Card */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight block mb-1">
                  Send Payment To ({selectedMethod.accountName || selectedMethod.name}):
                </label>
                <div className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 rounded-xl font-mono text-xs shadow-xs transition-colors">
                  <span className="truncate pr-2 font-bold text-slate-900 select-all">{selectedMethod.accountId}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyAccount(selectedMethod.accountId);
                    }}
                    className="py-1.5 px-3 bg-[#FF6B00] hover:bg-[#E66000] text-white text-[10px] font-black rounded-lg shadow-xs transition shrink-0 flex items-center gap-1 active:scale-95"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                        <span>Copied!</span>
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

              {/* Step-by-Step Instructions */}
              <div className="space-y-1 bg-orange-50/40 p-3 rounded-xl border border-orange-100">
                <p className="text-[11px] font-bold text-orange-950 mb-1">Instructions:</p>
                {selectedMethod.instructions.map((step, idx) => (
                  <p key={idx} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                    <span className="font-bold text-[#FF6B00]">{idx + 1}.</span>
                    <span>{step}</span>
                  </p>
                ))}
              </div>

              {/* Submit Payment CTA Button */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  if (cart.length === 0) {
                    triggerHaptic('light');
                    onBrowseServices();
                  } else {
                    handlePaidSubmit();
                  }
                }}
                className="w-full py-3.5 text-xs font-black rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 bg-[#FF6B00] hover:bg-[#E66000] text-white transition-all transform active:scale-95 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Submitting Order...</span>
                  </>
                ) : cart.length === 0 ? (
                  <>
                    <ShoppingBag className="w-4 h-4 text-white" />
                    <span>Choose a Product to Order</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-white" />
                    <span>I&apos;ve Paid &bull; Submit Order</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
