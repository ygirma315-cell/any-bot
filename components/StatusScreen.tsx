'use client';

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ShoppingBag, 
  ShieldCheck, 
  Sparkles, 
  RefreshCw, 
  Mail, 
  User, 
  Key, 
  ExternalLink, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Search, 
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { getStoredOrders, mapOrdersFromDb } from '@/lib/store';
import { OrderPayload } from '@/lib/bot';
import { getTelegramUser, triggerHaptic } from '@/lib/telegram';

interface StatusScreenProps {
  onBrowseServices: () => void;
}

export const StatusScreen: React.FC<StatusScreenProps> = ({ onBrowseServices }) => {
  const [orders, setOrders] = useState<OrderPayload[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [lookupQuery, setLookupQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(id);
      setTimeout(() => setCopiedKey(null), 2000);
      triggerHaptic('light');
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const loadOrders = async () => {
    const sessionOrders = getStoredOrders();
    const { user } = getTelegramUser();
    const telegramId = user?.id;

    let history: OrderPayload[] = [];
    if (telegramId && telegramId !== 987654321) {
      try {
        const res = await fetch(`/api/orders?telegramId=${encodeURIComponent(telegramId)}`);
        const body = await res.json().catch(() => ({}));
        if (body.success && Array.isArray(body.data)) {
          history = mapOrdersFromDb(body.data);
        }
      } catch {
        // fall back to session orders only
      }
    }

    const seen = new Set<string>();
    const merged: OrderPayload[] = [];
    history.forEach(o => {
      if (!seen.has(o.orderId)) {
        seen.add(o.orderId);
        merged.push(o);
      }
    });
    sessionOrders.forEach(o => {
      if (!seen.has(o.orderId)) {
        seen.add(o.orderId);
        merged.push(o);
      }
    });

    setOrders(prev => {
      if (prev.length !== merged.length) return merged;
      for (let i = 0; i < prev.length; i++) {
        if (prev[i].orderId !== merged[i].orderId || prev[i].status !== merged[i].status) {
          return merged;
        }
      }
      return prev;
    });
  };

  const handleLookupOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;

    setIsSearching(true);
    setSearchMessage(null);

    try {
      const q = lookupQuery.trim();
      const res = await fetch(`/api/orders?query=${encodeURIComponent(q)}`);
      const body = await res.json().catch(() => ({}));
      
      if (body.success && Array.isArray(body.data) && body.data.length > 0) {
        const found = mapOrdersFromDb(body.data);
        setOrders(prev => {
          const map = new Map<string, OrderPayload>();
          found.forEach(o => map.set(o.orderId, o));
          prev.forEach(o => { if (!map.has(o.orderId)) map.set(o.orderId, o); });
          return Array.from(map.values());
        });
        setSearchMessage(`✅ Found ${found.length} order(s)!`);
      } else {
        // Check local session
        const localMatch = getStoredOrders().filter(o => 
          o.orderId.toLowerCase().includes(q.toLowerCase()) || 
          (o.deliveryEmail && o.deliveryEmail.toLowerCase().includes(q.toLowerCase()))
        );
        if (localMatch.length > 0) {
          setOrders(localMatch);
          setSearchMessage(`✅ Found ${localMatch.length} order(s) in session!`);
        } else {
          setSearchMessage('❌ No orders found for this ID or email. Please check and try again.');
        }
      }
    } catch {
      setSearchMessage('❌ Lookup error. Please try again or check your delivery email.');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    loadOrders();

    const handleOrdersUpdate = () => loadOrders();
    window.addEventListener('ai_store_orders_updated', handleOrdersUpdate);

    const interval = setInterval(loadOrders, 20000);

    return () => {
      window.removeEventListener('ai_store_orders_updated', handleOrdersUpdate);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="px-4 py-4 space-y-4 pb-28 max-w-4xl mx-auto animate-fadeIn">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="heading-font text-lg font-bold text-slate-900">MY ORDER STATUS</h2>
          <p className="text-xs text-slate-500">Live order tracking, credential delivery &amp; verification</p>
        </div>
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            loadOrders();
          }}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-orange-600 shadow-xs flex items-center gap-1 text-xs transition"
          title="Refresh orders"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Required Support / Email Delivery Banner Notice */}
      <div className="p-3.5 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 rounded-2xl border border-blue-200/80 text-xs text-slate-800 space-y-1.5 shadow-xs">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-extrabold text-blue-950 text-[12px]">Order &amp; Delivery Notice:</p>
            <p className="text-[11.5px] text-blue-900 leading-relaxed mt-0.5">
              If you ordered a product and it didn&apos;t appear here, please check the <strong className="text-blue-950 font-bold underline">delivery email</strong> that you entered during checkout, otherwise contact us directly at <a href="https://t.me/exo80" target="_blank" rel="noopener noreferrer" className="font-extrabold text-blue-950 underline hover:text-orange-600">@exo80</a>.
            </p>
          </div>
        </div>
      </div>

      {/* Order Lookup Form */}
      <form onSubmit={handleLookupOrder} className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-2">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order ID (e.g. ORD-123456) or Delivery Email..."
            value={lookupQuery}
            onChange={e => setLookupQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-orange-500 font-medium transition"
          />
        </div>
        <button
          type="submit"
          disabled={isSearching || !lookupQuery.trim()}
          className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 shrink-0"
        >
          {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          <span>Find Order</span>
        </button>
      </form>

      {searchMessage && (
        <div className="p-2.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700">
          {searchMessage}
        </div>
      )}

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="px-4 py-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[40vh] bg-white rounded-3xl border border-slate-200/80 shadow-xs animate-fadeIn">
          {/* Glowing Icon Container */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-orange-500/20 via-amber-500/20 to-purple-500/20 blur-xl animate-pulse" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FF6B00] to-amber-500 p-0.5 shadow-xl flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center relative overflow-hidden">
                <ShoppingBag className="w-7 h-7 text-orange-300 stroke-[2.2]" />
                <Sparkles className="w-3.5 h-3.5 text-amber-400 absolute top-1.5 right-1.5 animate-bounce" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5 max-w-xs mx-auto">
            <h2 className="heading-font text-base font-extrabold text-slate-900">No Active Orders Recorded</h2>
            <p className="text-xs font-semibold text-slate-500 leading-relaxed">
              When you purchase a service and submit payment, your order status and credentials will appear here in real-time.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onBrowseServices();
            }}
            className="px-6 py-3 bg-[#FF6B00] hover:bg-[#E66000] text-white font-extrabold text-xs rounded-xl shadow-md shadow-orange-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4 text-white stroke-[2.5]" />
            <span className="tracking-wide">Browse Products</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isPending = order.status === 'Pending' || order.status === 'Payment Submitted';
            const isAccepted = order.status === 'Accepted' || order.status === 'Completed' || order.status === 'Payment Confirmed';
            const isRejected = order.status === 'Rejected' || order.status === 'Cancelled';
            const creds = order.deliveredCredentials || [];

            return (
              <div
                key={order.orderId}
                className="p-4 sm:p-5 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm space-y-4 relative overflow-hidden"
              >
                {/* Header Status Badge */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Order ID</span>
                    <p className="font-mono text-xs font-bold text-slate-900">{order.orderId}</p>
                  </div>

                  <div>
                    {isPending && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200/80 animate-pulse">
                        <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Verification
                      </span>
                    )}
                    {isAccepted && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200/80">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Payment Accepted &amp; Delivered
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
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-extrabold text-slate-900">
                      <User className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{order.telegramUser.username ? `@${order.telegramUser.username}` : (order.telegramUser.first_name || 'Customer')}</span>
                    </div>
                    <span className="text-[10.5px] text-slate-400 font-semibold">{order.timestamp}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 pt-1.5 border-t border-slate-200/60">
                    <Mail className="w-3.5 h-3.5 text-[#FF6B00] shrink-0" />
                    <span>Delivery Email: <strong className="text-slate-900 font-bold">{order.deliveryEmail || (order.telegramUser.username ? `${order.telegramUser.username}@example.com` : 'Entered during checkout')}</strong></span>
                  </div>
                </div>

                {/* Product items */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tight">Ordered Products</span>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
                      <span className="font-semibold text-slate-800">{item.name} <span className="text-slate-500">×{item.quantity}</span></span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-emerald-600 font-bold">{item.warranty}</span>
                        <span className="font-bold text-slate-900">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total & Payment Method */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500 font-medium">Method: <strong className="text-slate-800">{order.paymentMethod.name}</strong></span>
                  <span className="heading-font text-sm font-extrabold text-orange-600">Total: ${order.total.toFixed(2)}</span>
                </div>

                {/* DELIVERED CREDENTIALS DISPLAY (When Order is Accepted) */}
                {isAccepted && creds.length > 0 && (
                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50/60 rounded-2xl border border-emerald-200/90 space-y-3 shadow-xs animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                        <Key className="w-4 h-4 text-emerald-600" />
                        <span>YOUR PRODUCT ACCESS &amp; CREDENTIALS</span>
                      </h4>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-200/60 text-emerald-900">
                        {creds.length} Item(s) Delivered
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {creds.map((cred, cIdx) => {
                        const credId = `${order.orderId}_${cIdx}`;
                        const isPwVisible = visiblePasswords[credId];

                        return (
                          <div key={cIdx} className="p-3 bg-white rounded-xl border border-emerald-200/80 shadow-xs space-y-2 text-xs">
                            {/* Product Name if present */}
                            {cred.product_name && (
                              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                                <span className="font-extrabold text-slate-900 text-[11.5px]">{cred.product_name}</span>
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                  {cred.type ? cred.type.toUpperCase() : 'CREDENTIAL'}
                                </span>
                              </div>
                            )}

                            {/* Username / Account */}
                            {cred.username && (
                              <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                                <div>
                                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Username / Email:</span>
                                  <span className="font-mono font-bold text-slate-900">{cred.username}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(cred.username!, `${credId}_user`)}
                                  className="p-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
                                  title="Copy username"
                                >
                                  {copiedKey === `${credId}_user` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            )}

                            {/* Password */}
                            {cred.password && (
                              <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                                <div>
                                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Password:</span>
                                  <span className="font-mono font-bold text-slate-900">
                                    {isPwVisible ? cred.password : '••••••••••••'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility(credId)}
                                    className="p-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                                    title={isPwVisible ? 'Hide password' : 'Show password'}
                                  >
                                    {isPwVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(cred.password!, `${credId}_pass`)}
                                    className="p-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
                                    title="Copy password"
                                  >
                                    {copiedKey === `${credId}_pass` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Link / URL */}
                            {cred.link && (
                              <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                                <div className="min-w-0 flex-1 pr-2">
                                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Access Link / Key:</span>
                                  <a
                                    href={cred.link.startsWith('http') ? cred.link : `https://${cred.link}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-mono font-bold text-blue-600 hover:underline truncate block text-[11px]"
                                  >
                                    {cred.link}
                                  </a>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <a
                                    href={cred.link.startsWith('http') ? cred.link : `https://${cred.link}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-blue-600 transition"
                                    title="Open link"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(cred.link!, `${credId}_link`)}
                                    className="p-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
                                    title="Copy link"
                                  >
                                    {copiedKey === `${credId}_link` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* How to Use / Activation Instructions */}
                            {cred.notes && (
                              <div className="bg-amber-50/90 p-3 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-1 shadow-2xs">
                                <span className="font-black text-[11px] text-amber-900 uppercase flex items-center gap-1">
                                  📖 How to Use / Activation Instructions:
                                </span>
                                <p className="text-[11.5px] text-amber-900 leading-relaxed font-medium">
                                  {cred.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Status Message Info Notice */}
                {isPending && (
                  <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/60 text-xs text-amber-900 space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      ⏳ Payment Pending Admin Review
                    </p>
                    <p className="text-[11px] text-amber-800 leading-snug">
                      Your payment receipt has been submitted to the admin team. Once confirmed, your subscription credentials will be sent to your email and displayed right here!
                    </p>
                  </div>
                )}

                {isAccepted && (
                  <div className="p-3.5 bg-emerald-50/90 rounded-2xl border border-emerald-200/80 text-xs text-emerald-950 space-y-2">
                    <p className="font-extrabold text-emerald-900 flex items-center gap-1.5 text-xs">
                      <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>🎉 Order Fulfilled!</span>
                    </p>
                    <p className="text-[11.5px] text-emerald-900 font-medium leading-relaxed">
                      Your credentials have also been dispatched to your delivery email: <strong className="text-emerald-950 font-bold underline">{order.deliveryEmail || 'email'}</strong>.
                    </p>
                    <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                      <span className="text-[10px] text-emerald-700 font-medium">Instant Delivery Active</span>
                      <a
                        href="https://t.me/exo80"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-[#FF6B00] transition-colors underline"
                      >
                        <span>Contact Support (@exo80)</span>
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
                      The admin could not confirm payment for this transaction. Please verify your payment reference or contact support at @exo80.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
