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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Customer Details, Policy & Methods (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Customer & Delivery Summary Card */}
          {cart.length > 0 && (
            <div className="p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                  <Mail className="w-4 h-4 text-[#FF6B00]" /> Customer &amp; Delivery Destination
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/80 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400" /> Delivery Target
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Telegram Handle</span>
                    <span className="font-extrabold text-orange-600 truncate block">
                      @{getTelegramUser().user.username || 'web_customer'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Delivery Email</span>
                    <span className="font-extrabold text-slate-900 truncate block">
                      {userEmail || 'No email provided'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment & Refund Policy */}
          {cart.length > 0 && (
            <div className="p-3.5 bg-orange-50/70 rounded-2xl border border-orange-200/70 text-xs space-y-1.5">
              <p className="font-extrabold text-orange-950 flex items-center gap-1">
                <FileText className="w-4 h-4 text-[#FF6B00]" /> Payment &amp; Refund Policy:
              </p>
              <div className="space-y-1 text-[11px] text-slate-700 leading-snug">
                <p>• <strong>Instant Dispatch:</strong> Product credentials will be sent to your email immediately upon verification.</p>
                <p>• <strong>Warranty Products:</strong> Refunds &amp; replacements are valid <strong>ONLY up to the specified warranty period</strong>.</p>
                <p>• <strong>Non-Warranty Products:</strong> Strictly <strong>NO REFUNDS</strong> or replacements for non-warranty items.</p>
              </div>
            </div>
          )}

          {/* Methods Selector Cards */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
              Select Payment Method:
            </h3>
            {methods.map((method) => {
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
                        <h4 className="heading-font text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          {method.name}
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {method.badge}
                          </span>
                        </h4>
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
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Sticky Transfer Details & Submit CTA (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-4">
          {selectedMethod && (
            <div className="p-5 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-md space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-extrabold text-slate-900 uppercase">Transfer Summary</span>
                <span className="text-xs font-extrabold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                  {selectedMethod.name}
                </span>
              </div>

              {cart.length > 0 ? (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-xs font-medium text-slate-600">Total Due:</span>
                  <span className="heading-font text-xl font-extrabold text-[#FF6B00]">
                    ${totalAmount.toFixed(2)} USD
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs font-semibold text-indigo-900">
                  <span>Order Status:</span>
                  <span className="text-indigo-600 font-extrabold">No product selected</span>
                </div>
              )}

              <div>
                <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-tight block mb-1">
                  Send Payment To ({selectedMethod.accountName}):
                </label>
                <div className="flex items-center justify-between p-3 bg-slate-900 text-white rounded-xl font-mono text-xs shadow-xs">
                  <span className="truncate pr-2">{selectedMethod.accountId}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyAccount(selectedMethod.accountId);
                    }}
                    className="py-1 px-3 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold rounded-lg border border-white/20 transition shrink-0 flex items-center gap-1"
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

              <div className="space-y-1 bg-orange-50/50 p-3.5 rounded-xl border border-orange-100">
                <p className="text-[11px] font-bold text-orange-950 mb-1">Payment Instructions:</p>
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
                className="w-full py-4 text-xs font-extrabold rounded-2xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 bg-[#FF6B00] hover:bg-[#E66000] text-white transition-all transform active:scale-95 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Submitting Order to Server...</span>
                  </>
                ) : cart.length === 0 ? (
                  <>
                    <ShoppingBag className="w-4 h-4 text-white" />
                    <span>Choose a Product to Order</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-white" />
                    <span>Submit Payment (I&apos;ve Paid)</span>
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
