'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ShoppingBag, Plus, Minus, Trash2, ShieldCheck, ShieldAlert, ArrowRight, Sparkles, FileText, Mail, AlertCircle, Info } from 'lucide-react';
import { Product } from '@/config/products';
import { triggerHaptic } from '@/lib/telegram';

interface OrderItem {
  product: Product;
  quantity: number;
}

interface OrderScreenProps {
  cart: OrderItem[];
  userEmail: string;
  setUserEmail: (email: string) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToPayment: () => void;
  onBrowseServices: () => void;
}

export const OrderScreen: React.FC<OrderScreenProps> = ({
  cart,
  userEmail,
  setUserEmail,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToPayment,
  onBrowseServices
}) => {
  const [emailError, setEmailError] = useState<string>('');

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const total = subtotal;

  const handleContinue = () => {
    if (!userEmail.trim()) {
      setEmailError('Please enter your email address to receive the product.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail.trim())) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setEmailError('');
    triggerHaptic('medium');
    onProceedToPayment();
  };

  if (cart.length === 0) {
    return (
      <div className="px-4 py-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[60vh] animate-fadeIn">
        {/* Empty State Card Illustration with Crisp Border */}
        <div className="relative w-32 h-32 rounded-3xl bg-white p-2 border-2 border-orange-200/80 shadow-md flex items-center justify-center">
          <div className="w-full h-full bg-orange-50/70 rounded-[22px] border border-orange-100 flex items-center justify-center relative overflow-hidden">
            <ShoppingBag className="w-14 h-14 text-[#FF6B00] relative z-10" />
            <Sparkles className="w-5 h-5 text-amber-500 absolute top-3 right-3 animate-pulse" />
          </div>
        </div>

        <div className="space-y-1.5 max-w-xs">
          <h2 className="heading-font text-xl font-extrabold text-slate-900">Your order is empty</h2>
          <p className="text-xs font-semibold text-slate-600 leading-relaxed">
            Choose a premium digital AI service to get started with instant delivery.
          </p>
        </div>

        {/* High-Contrast Solid Orange Button with Border */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onBrowseServices();
          }}
          className="px-7 py-3.5 bg-[#FF6B00] hover:bg-[#E66000] text-white font-extrabold text-xs rounded-2xl border-2 border-orange-400 shadow-md hover:shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4 text-white stroke-[2.5]" />
          <span>Browse Services</span>
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4 pb-28">
      {/* Header Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="heading-font text-lg font-bold text-slate-900">YOUR ORDER</h2>
          <p className="text-xs text-slate-500">Review selected services & add your delivery email</p>
        </div>
        <span className="text-xs font-bold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100">
          {cart.reduce((sum, item) => sum + item.quantity, 0)} Items
        </span>
      </div>

      {/* Mandatory Delivery Email Section */}
      <div className="p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-orange-200/80 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
            <Mail className="w-4 h-4 text-[#FF6B00]" /> Delivery Email Address <span className="text-rose-500">*</span>
          </label>
          <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
            Mandatory
          </span>
        </div>

        <div className="relative">
          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="email"
            value={userEmail}
            onChange={(e) => {
              setUserEmail(e.target.value);
              if (emailError) setEmailError('');
            }}
            placeholder="enter-your-email@example.com"
            className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white transition-all ${
              emailError ? 'border-rose-500 focus:border-rose-500' : 'border-slate-200 focus:border-[#FF6B00]'
            }`}
          />
        </div>

        {emailError && (
          <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-fadeIn">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{emailError}</span>
          </p>
        )}

        <div className="p-2.5 bg-orange-50/70 rounded-xl border border-orange-100 text-[11px] text-orange-950 space-y-1">
          <p className="font-bold flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-[#FF6B00] shrink-0" /> Important Email Rules:
          </p>
          <p className="text-slate-700 leading-snug">
            • We send the digital product access credentials directly to this email.<br />
            • <strong>1 Product per 1 Email Limit:</strong> Each email address can only be used once for the same product.
          </p>
        </div>
      </div>

      {/* Cart Items List */}
      <div className="space-y-3">
        {cart.map(({ product, quantity }) => {
          const isWarrantyActive = product.isWarranty !== false;

          return (
            <div
              key={product.id}
              className="p-3.5 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs space-y-3 transition-all hover:shadow-md"
            >
              {/* Top row: Logo, Info & Quantity controls */}
              <div className="flex items-center justify-between gap-3">
                {/* Logo Tile */}
                <div className="w-12 h-12 relative rounded-2xl bg-white p-1.5 border-2 border-slate-200/90 shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
                  <Image
                    src={product.logoPath || '/assets/products/chatgpt.png'}
                    alt={product.name}
                    width={36}
                    height={36}
                    className="object-contain w-full h-full max-w-[36px] max-h-[36px] mx-auto my-auto"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="heading-font text-xs font-bold text-slate-900 truncate">
                    {product.name}
                  </h3>

                  {isWarrantyActive ? (
                    <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{product.warranty}</span>
                    </p>
                  ) : (
                    <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-0.5">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>No Warranty (No Refunds)</span>
                    </p>
                  )}

                  <p className="text-xs font-extrabold text-slate-900 mt-1">
                    {product.currency}{product.price.toFixed(2)}{' '}
                    <span className="text-[10px] font-normal text-slate-400">each</span>
                  </p>
                </div>

                {/* Quantity Controls & Remove */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      onRemoveItem(product.id);
                    }}
                    className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-2 bg-slate-100/90 rounded-lg p-1 border border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        onUpdateQuantity(product.id, -1);
                      }}
                      className="w-5 h-5 rounded-md bg-white text-slate-700 flex items-center justify-center text-xs font-bold shadow-xs hover:bg-slate-50"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-slate-900 px-1">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        onUpdateQuantity(product.id, 1);
                      }}
                      className="w-5 h-5 rounded-md bg-white text-slate-700 flex items-center justify-center text-xs font-bold shadow-xs hover:bg-slate-50"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Updated Rules & Service Terms Section */}
              <div className="pt-2.5 border-t border-slate-100 bg-slate-50 p-2.5 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-1">
                    <FileText className="w-3 h-3 text-[#FF6B00]" /> Refund & Warranty Rules:
                  </span>
                  {isWarrantyActive ? (
                    <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Refunds Up To {product.warrantyDays} Days
                    </span>
                  ) : (
                    <span className="text-[9.5px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                      No Warranty / No Refunds
                    </span>
                  )}
                </div>
                <div className="space-y-0.5 text-[10.5px] text-slate-600">
                  {isWarrantyActive ? (
                    <p className="flex items-start gap-1">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span><strong>Refund & Replacement Policy:</strong> Full support is provided <strong>ONLY up to {product.warrantyDays} days</strong> of warranty.</span>
                    </p>
                  ) : (
                    <p className="flex items-start gap-1 text-rose-700 font-semibold">
                      <span className="text-rose-500 font-bold">•</span>
                      <span><strong>No Refund Policy:</strong> This product has no warranty. Strictly NO refunds or replacements.</span>
                    </p>
                  )}
                  {product.features.slice(0, 2).map((rule, idx) => (
                    <p key={idx} className="flex items-start gap-1">
                      <span className="text-[#FF6B00] font-bold">•</span>
                      <span>{rule}</span>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Calculation Box */}
      <div className="p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>Subtotal</span>
          <span className="font-semibold text-slate-900">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>Instant Email Delivery ({userEmail || 'Required'})</span>
          <span className="font-semibold text-emerald-600">FREE</span>
        </div>
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-sm">
          <span className="font-bold text-slate-900">TOTAL</span>
          <span className="heading-font text-lg font-extrabold text-[#FF6B00]">${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Action Button */}
      <button
        type="button"
        onClick={handleContinue}
        className="btn-pill btn-pill-primary w-full py-4 text-xs font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2 bg-[#FF6B00] hover:bg-[#E66000] text-white"
      >
        <span>Continue to Payment</span>
        <ArrowRight className="w-4 h-4 text-white" />
      </button>
    </div>
  );
};
